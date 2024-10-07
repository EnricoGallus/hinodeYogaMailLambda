import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
const sesClient = new SESClient({ region: 'us-east-1' });
const SENDER_EMAIL = process.env.SENDER_MAIL_ADDRESS;
const RECEIVER_EMAIL = process.env.RECEIVER_MAIL_ADDRESS;

export const handler = async (inquireData) => {
    if (!inquireData.name || !inquireData.email || !inquireData.message || !inquireData.contactType) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing required fields' }),
        };
    }

    let emailbody = `
        <html>
            <body>
                <p>Name: ${inquireData.name}</p>
                <p>Email: ${inquireData.email}</p>
                <p>Message: ${inquireData.message}</p>
            </body>
        </html>`;
    let emailSubject = "contact form (hinode.enchan.org) " + inquireData.contactType;
    const params = {
        Source: SENDER_EMAIL,
        Destination: {
            ToAddresses: [RECEIVER_EMAIL],
        },
        Message: {
            Subject: {
                Data: emailSubject,
                Charset: 'UTF-8'
            },
            Body: {
                Html: {
                    Data: emailbody,
                    Charset: 'UTF-8'
                },
            },
        },
    };

    const sendEmailCommand = new SendEmailCommand(params);

    try {
        await sesClient.send(sendEmailCommand);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error sending email' }),
        };
    }
};