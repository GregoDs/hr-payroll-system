function logger(req, res, next) {

    const startTime = Date.now();

    console.log("------------------------------------------------");
    console.log(`[${new Date().toISOString()}]`);
    console.log(`${req.method} ${req.originalUrl}`);

    const requestBody = req.body ?? {};

        if (Object.keys(requestBody).length > 0) {
            console.log("Request Body:");
            console.log(requestBody);
        }

    //Interceptor where res will actually see response returned
    const originalJson = res.json;

    res.json = function (body) {
        console.log("Response:");
        console.log(body);

        return originalJson.call(this, body);
    };

    res.on("finish", () => {
        const duration = Date.now() - startTime;

        console.log(`Status: ${res.statusCode}`);
        console.log(`Completed in ${duration} ms`);
        console.log("------------------------------------------------\n");

    });

    next();
}

module.exports = logger;