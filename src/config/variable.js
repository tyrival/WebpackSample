var Variable = {
    storage: {},

    /**
     * 将<key, value>键值对存⼊入，如果key已经存在，则报错error
     * @param key
     * @param value
     */
    add: function(key, value) {
        if (this.storage[key] !== undefined) {
            throw new Error("错误：全局变量 【" + key + "】已存在");
        }
        this.storage[key] = value;
    },

    /**
     * 根据key取值
     * @param key
     */
    get: function (key) {
        return this.storage[key];
    },

    /**
     * 将<key, value>修改值
     * @param key
     * @param value
     */
    set: function(key, value) {
        this.storage[key] = value;
    },

    /**
     * 删除<key, value>键值对
     */
    remove: function (key) {
        delete this.storage[key];
    },
}