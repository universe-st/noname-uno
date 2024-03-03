import {lib,game,ui,get,ai,_status} from '../../../noname.js'

let basicPath = lib.init.getCurrentFileLocation(import.meta.url);

export let basic={
    /**
     * 扩展目录地址，自动生成。
     */
    extensionDirectoryPath:basicPath.slice(0,basicPath.lastIndexOf('source/basic.js')),

    extensionName:null,

    getExtensionName:()=>{
        if(basic.extensionName)return basic.extensionName;
        let str1 = basicPath.slice(0,basicPath.lastIndexOf('/source/basic.js'));
        basic.extensionName = str1.slice(str1.lastIndexOf('/')+1);
        return basic.extensionName;
    },

    getExtensionRelativePath:()=>{
        return 'extension/'+basic.extensionName+'/';
    },

    /**
     * 如果参数是function，返回其结果的promise。如果参数是普通对象，返回Promise.resolve(obj);
     * @param {*} obj 
     * @returns 
     */
    resolve:function(obj){
        if(typeof obj == 'function'){
            return Promise.resolve(obj());
        }else{
            return Promise.resolve(obj);
        }
    },
};