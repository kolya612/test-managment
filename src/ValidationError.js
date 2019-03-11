class ValidationError extends Error {

    constructor(errors) {
    	super('validation error');
        this.errors = errors;
    }
}

module.exports = { ValidationError };