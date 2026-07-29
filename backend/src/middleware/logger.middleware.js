function logger(req, res, next) {
    const startedAt = Date.now();
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    let responseBody;

    const originalJson = res.json;
    res.json = function (body) {
        responseBody = body;
        return originalJson.call(this, body);
    };

    res.on("finish", () => {
        const duration = Date.now() - startedAt;
        const lines = [
            "------------------------------------------------",
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
            `Request ID: ${requestId}`,
        ];

        const requestBody = summarizeBody(sanitizeBody(req.body));
        if (requestBody) {
            lines.push(`Request Body: ${requestBody}`);
        }

        lines.push(`Status: ${res.statusCode}`);

        const responseSummary = summarizeBody(responseBody);
        if (responseSummary) {
            lines.push(`Response Body: ${responseSummary}`);
        }

        lines.push(`Completed in ${duration} ms`);
        lines.push("------------------------------------------------\n");
        console.log(lines.join("\n"));
    });

    next();
}

function sanitizeBody(body) {
    if (!body || typeof body !== "object") {
        return body;
    }

    return Object.fromEntries(
        Object.entries(body).map(([key, value]) => {
            if (["password", "token", "authorization"].includes(key.toLowerCase())) {
                return [key, "[redacted]"];
            }
            return [key, value];
        })
    );
}

function summarizeBody(body) {
    if (!body) {
        return "";
    }

    if (Array.isArray(body)) {
        return `[${body.length} items]`;
    }

    if (typeof body !== "object") {
        return String(body);
    }

    if (Array.isArray(body.data)) {
        return JSON.stringify({
            success: body.success,
            statusCode: body.statusCode,
            message: body.message,
            data: `[${body.data.length} items]`
        });
    }

    return truncate(JSON.stringify(body));
}

function truncate(value, maxLength = 1200) {
    if (!value || value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength)}... [truncated]`;
}

module.exports = logger;
