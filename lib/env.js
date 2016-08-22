const Env = function(parent = null, values = {}) {
    this.values = values;
    this.parent = parent;
};

Env.prototype.find = function(name) {
    if (this.values[name])
        return this.values[name];
    if (this.parent)
        return this.parent.find(name);

    return null;
};

Env.prototype.set = function(name, val) {
    this.values[name] = val;
    return this;
};

export default Env;
