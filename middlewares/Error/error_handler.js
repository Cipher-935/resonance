module.exports = (error, req,res, next) => {
    res.status(error.status).json({
        resp: error.message
    });
}
