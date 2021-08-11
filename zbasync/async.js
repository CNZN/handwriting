

//实现asyncDemo
const asyncDemo = (demo) => {
	//上面代码执行asyncDemo(demo)需要返回一个函数
	return function(){
		const demoFoo = demo.apply(this, arguments)
		//既然要调用then方法，即return promise
		return new Promise((res, rej) => {
			//声明进一步的函数
			function step(behavior, arg){
				let result
				try{
					result = demoFoo[behavior](arg)
				}
				catch(error){
					return rej(error)
				}
				const {value, done} = result;
				if(done){
					return res(value);
				}
				else{
					return Promise.resolve(value).then(
						function onResolve(val){
							step('next', val)
						},
						function onReject(err){
							step('throw', err)
						}
					)
				}
			}
			step('next')
		})
	}
}
