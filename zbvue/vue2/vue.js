class Vue{
    constructor(options={}){
        this.$el = document.querySelector(options.el);
        let data = this.data = options.data;
        // 代理data,使this.data.xxx 变为this.xxx
        Object.keys(data).forEach(key=>{
            this.proxyData(key);
        })
        this.methdos = options.methods;//事件方法
        this.watcherTask = {};// 监听列表
        this.observer(data) // 劫持监听数据
        this.compile(this.$el); // 解析dom
        
    }
    proxyData(key){ // 单纯改变了 dta的访问形式
        let that = this;
        Object.defineProperty(that,key,{
            configurable: false, // 不可配置
            enumerable:true, // 可遍历
            get(){
                return that.data[key];
            },
            set(newVal){
                that.data[key]=newVal;
            }
        })
    }

    observer(data){ // 改变data的原始结构，监听数据
        let that = this;
        Object.keys(data).forEach(key=>{
            let value = data[key];
            this.watcherTask[key]=[];
            Object.defineProperty(data,key,{
                configurable:false,
                enumerable:true,
                get(){
                    return value;
                },
                set(newVal){
                    if(newVal!==value){ // 简单判断， 实际上会复杂很多
                        value = newVal;
                        //此处如果是深层对象 需要递归种植监听依赖dep
                        that.watcherTask[key].forEach(task=>{
                            task.update()
                        })
                    }
                }
            })
        })
    }

    compile(el){
        var nodes = el.childNodes;
        for(let i = 0;i<nodes.length; i++){
            const node = nodes[i];
            if(node.nodeType===3){ // 3 文本 
                var text = node.textContent.trim();
                if(!text)continue;
                this.compileText(node,'textContent')
 
            }else if(node.nodeType===1){ // 标签 
                 if(node.childNodes.length>0){
                     this.compile(node)
                 }
                 if(node.hasAttribute('v-model')
                 &&
                 (node.tagName==='INPUT'
                 ||
                 node.tagName === 'TEXTAREA')
                 ){
                    node.addEventListener('input',(()=>{
                        let attrVal = node.getAttribute('v-model');
                    
                        // 绑定监视器后 移除语法标记 
                        this.watcherTask[attrVal].push(
                            new Watcher(node,this,attrVal,'value')
                        )
                        node.removeAttribute('v-model');
                        return ()=>{
                            // 输入时改变 data的值
                            this.data[attrVal] = node.value;
                        }
                    })()) // 要调用一次 才能给输入控件赋值
                 }
                 if(node.hasAttribute('v-html')){
                     let attrVal = node.getAttribute('v-html');
                     this.watcherTask[attrVal].push(
                        new Watcher(node,this,attrVal,'innerHTML')
                    )
                    node.removeAttribute('v-html')
                 }
                 this.compileText(node,'innerHTML');
                 if(node.hasAttribute('@click')){
                    let attrVal = node.getAttribute('@click');
                    node.removeAttribute('@click');
                    node.addEventListener('click',e=>{
                    
                        // 把方法绑定到当前vm并且执行
                        this.methdos[attrVal] && this.methdos[attrVal].bind(this)();
                    })
                 }
 
            }
        }
 
    }
    compileText(node,type){
        let reg = /\{\{(.*?)\}\}/g,  txt = node.textContent;
        if(reg.test(txt)){
            node.textContent = txt.replace(reg,(matched,value)=>{
                value = value.trim();
                let tpl = this.watcherTask[value] || [];
                tpl.push(new Watcher(node,this,value,type));
                if(value.split('.').length>1){
                    let v=null;
                    // 根据属性拿到最终值
                    value.split('.').forEach((val,i)=>{
                        v = !v ? this[val] : v[val]
                    })
                    return v;
                }else{
                    return this[value]
                }
            })
        }
 
    }
 
 
}
 
class Watcher{
    constructor(el,vm,value,type){
        this.el= el;
        this.vm = vm;
        this.value = value;
        this.type = type;
        this.update();
 
    }
    update(){
        this.el[this.type] = this.vm.data[this.value]
    }
}