class ApiResponse{
    constructor(statuscode, message = "Success", data){
        this.statuscode = statuscode
        this.data = data
        this.success = true
        this.message = message
    }
}

export {ApiResponse}