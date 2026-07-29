
function errorHandler(error, req, res, next) {

    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
        console.error(error);
    } else {
        console.warn(`${req.method} ${req.originalUrl} -> ${statusCode}: ${error.message}`);
    }

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message: statusCode === 500
            ? "Internal server error."
            : error.message
    });

}

module.exports = errorHandler;
