function processResponse (body, statusCode) {
    console.log("process response for statusCode: " + statusCode);
    const status = statusCode || (body ? 200 : 204);
    const headers = {
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Allow-Origin': "https://hinode.enchan.org"
    };
    return {
        "isBase64Encoded": false,
        "statusCode": status,
        "body": JSON.stringify(body) || '',
        "headers": headers
    };
}

module.exports = {
    processResponse: processResponse,

    defaultReponse: function (errorMessageId) {
        return errorMessageId ? processResponse("successfully sent", 200) : processResponse("failed to send", 500);
    }
};