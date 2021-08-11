const PENGDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';
class MyPromise{
    constructor(executor){
        try {
            executor(this.resolve, this.reject)
        } catch (error) {
            // 如果有错误，就直接执行 reject
            this.reject(error)
        }
    };
    // 状态
    status = PENGDING;
    // 成功值
    data = null;
    // 失败原因
    error = null;
    onSuccessGroup = [];
    onErrorGroup = [];
    resolve= data => {
        if(this.status === PENGDING){
            this.status = FULFILLED;
            this.data = data;
            while(this.onSuccessGroup.length){
                this.onSuccessGroup.shift()(data)
            }
        }
    };
    reject= error => {
        if(this.status === PENGDING){
            this.status = REJECTED;
            this.error = error;
            while(this.onSuccessGroup.length){
                this.onSuccessGroup.shift()(error)
            }
        }
    }
    then = (onSuccess, onError) => {
        const promise = new MyPromise((res, rej) => {
            if(this.status === FULFILLED){
                queueMicrotask(() => {
                    try {
                        // 拿到.then的return
                        const val = onSuccess(this.data);
                        if (promise === val) {
                            return rej(new TypeError('Chaining cycle detected for promise #<Promise>'))
                        }
                        if(val instanceof MyPromise) {
                            val.then(res, rej)
                        } else{
                            // 普通值
                            res(val)
                        }
                    } catch (error) {
                        rej(error)
                    }  
                })  
            }
            else if (this.status === REJECTED) {
                onError(this.error);
            }
            else if (this.status === PENGDING) {
                this.onSuccessGroup.push(onSuccess);
                this.onErrorGroup.push(onError);
            }
        })
        return promise;
    }
};
