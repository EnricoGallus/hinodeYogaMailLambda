const AWS =  require("aws-sdk"),
    axios = require('axios'),
    querystring = require('querystring'),
    {processResponse, defaultReponse} = require('./process-response.js'),
    reCapUrl = "https://www.google.com/recaptcha/api/siteverify",
    reCaptchaSecret = "6Lea-74ZAAAAAN03UROYgJNqMtwIB6yjR6KqV6h3", // we got this from personal reCaptcha Google Page
    hinodeEmail = 'hinode.yoga2004@gmail.com';
// Set the region
AWS.config.update({region: 'ap-northeast-1'});

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.handler = async (event, context, callback) => {
    console.log("Starting ContactForm Processing for website hinode.enchan.org form.");
    // process the urlencoded body of the form submit and put it in a
    // map structure
    console.log(event);
    if (event.httpMethod === 'OPTIONS') {
        return processResponse();
    }

    if (!event.body) {
        return processResponse('Please specify email parameters: toEmails, subject, and message ', 400);
    }

    const emailData = JSON.parse(event.body);


    // its always a good idea to log so that we can inspect the params
    // later in Amazon Cloudwatch
    console.log(emailData);

    let data = querystring.stringify({
        secret: reCaptchaSecret,
        response: emailData.recaptchaResponse
    });
    //console.log(`Verify Post Data: ${JSON.stringify(data)}`);
    //console.log(`Verify Post Data Form Encoded: ${data}`);
    // verify the result by POSTing to google backend with secret and
    // frontend recaptcha token as payload
    let verifyResult = await axios.post(reCapUrl, data);
    // if you like you can also print out the result of that. Its
    // a bit verbose though
    //console.log(`Success ist: ${JSON.stringify(verifyResult.data)}`);
    if (!verifyResult.data.success) {
        console.log("reCaptcha check failed. Most likely SPAM.");
        callback(null, processResponse(true, "reCaptcha check failed.", 500));
        context.fail("recaptcha");
    }

    // 200 means that Google said the token is ok
    // now we create a simple emailbody aka the body of the SNS
    // message. If you want to do more than just emailing, you
    // should rethink the structure of the message though
    let emailbody = "Name: "+ emailData.fullName + "\n\nEmail: "+ emailData.email+"\n\nMessage: "+emailData.message;
    let emailSubject = "contact form (hinode.enchan.org) " + emailData.contactReason;
    let params = {
        Destination: {
            ToAddresses: [hinodeEmail],
        },
        Message: {
            Body: {
                Text: {
                    Data: emailbody,
                    Charset: 'UTF-8'
                }
            },
            Subject: {
                Data: emailSubject,
                Charset: 'UTF-8'
            }
        },
        Source: hinodeEmail
    };

    // we email using Amazon SES now…
    // Create the promise and SES service object
    var promiseResponse = await new AWS.SES({ apiVersion: "2010-12-01" })
        .sendEmail(params)
        .promise();
    console.log(promiseResponse);
    callback(null,  defaultReponse(promiseResponse.MessageId));
};
