// ye APIResponse class ka use karenge jab bhi hume API me successful response bhejna ho. Ye class additional properties add karta hai jaise status, data, message aur success.


class ApiResponse {

    constructor(status, data, message) {

        this.status = status;
        this.data = data;
        this.message = message;
        this.success = true;

    }
}

//export default ka use karenge taaki hum is class ko dusre files me import kar sake.

// export default vs export => { ApiResponse } ka difference ye hai ki export default me hum sirf ek hi cheez ko export kar sakte hai aur import karte waqt hum uska naam change kar sakte hai. Jabki export { ApiResponse } me hum multiple cheeze export kar sakte hai aur import karte waqt hume exact naam use karna padta hai.

export default ApiResponse;