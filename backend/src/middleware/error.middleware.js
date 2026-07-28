
function errorHandler(error, req, res, next) {

    const statusCode = error.statusCode || 500;
    console.error(error);

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message: statusCode === 500
            ? "Internal server error."
            : error.message
    });

}

module.exports = errorHandler;