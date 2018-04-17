var config = {
    dev: {
        database:"mongodb://localhost/iasip"
    }
};

exports.get = function get() {
    return config["dev"];
}
  