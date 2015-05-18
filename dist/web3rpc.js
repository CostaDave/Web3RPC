(function() {
  var factory,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  factory = function(web3, XMLHttpRequest) {
    var Web3RPC;
    Web3RPC = (function() {
      Web3RPC.RequestError = (function(superClass) {
        extend(RequestError, superClass);

        function RequestError(message, xhr1) {
          this.message = message;
          this.xhr = xhr1;
          this.name = "Web3RPC.RequestError";
        }

        return RequestError;

      })(Error);

      function Web3RPC(host, port) {
        var split;
        this.host = host;
        this.port = port;
        if (this.port == null) {
          split = this.host.split(":");
          this.host = split[0];
          this.port = split[1];
        }
        this.nonce = 0;
      }

      Web3RPC.prototype.send = function(method, params, callback) {
        var payload, xhr;
        if (typeof params === "function") {
          callback = params;
          params = [];
        }
        if (callback == null) {
          throw "send() function must be passed a callback!";
        }
        payload = {
          jsonrpc: "2.0",
          method: method,
          params: params,
          id: this.nonce
        };
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          var response;
          if (this.readyState === 4) {
            if (this.status !== 200) {
              callback(new Web3RPC.RequestError("Unexpected response code: " + xhr.status, this));
              return;
            }
            try {
              response = JSON.parse(this.responseText);
            } catch (_error) {
              callback(new Web3RPC.RequestError("Couldn't parse response", this));
              return;
            }
            if (response.error != null) {
              callback(new Web3RPC.RequestError(response.error.message, this));
              return;
            }
            return callback(null, response.result);
          }
        };
        xhr.open("POST", "http://" + this.host + ":" + this.port + "/", true);
        xhr.send(JSON.stringify(payload));
        return this.nonce += 1;
      };

      Web3RPC.prototype.call_or_transact = function(method, fully_qualified_name, abi, params, tx_params, block, callback) {
        var prefix;
        if (method == null) {
          method = "eth_call";
        }
        prefix = fully_qualified_name.slice(0, fully_qualified_name.indexOf("("));
        return this.send("web3_sha3", [web3.fromAscii(fully_qualified_name)], (function(_this) {
          return function(err, hex) {
            var fn_identifier, parsed;
            if (err != null) {
              callback(err, hex);
              return;
            }
            fn_identifier = hex.slice(0, 10);
            parsed = web3.abi.inputParser(abi)[prefix].apply(null, params);
            tx_params.data = fn_identifier + parsed;
            return _this.send(method, [tx_params, block], function(err, result) {
              if (err != null) {
                return callback(err, result);
              } else {
                if (method === "eth_call") {
                  return callback(null, web3.abi.outputParser(abi)[prefix].call(null, result)[0]);
                } else {
                  return callback(null, result);
                }
              }
            });
          };
        })(this));
      };

      Web3RPC.prototype.fullyQualifyNames = function(abi) {
        var fn, fully_qualified_name, i, input, j, len, len1, names, ref;
        names = {};
        for (i = 0, len = abi.length; i < len; i++) {
          fn = abi[i];
          if (fn.name.indexOf("(") > 0) {
            names[fn.name.substring(0, fn.name.indexOf("("))] = fn.name;
            continue;
          }
          fully_qualified_name = fn.name + "(";
          ref = fn.inputs;
          for (j = 0, len1 = ref.length; j < len1; j++) {
            input = ref[j];
            fully_qualified_name += input.type + ",";
          }
          if (fn.inputs.length > 0) {
            fully_qualified_name = fully_qualified_name.slice(0, fully_qualified_name.length - 1);
          }
          fully_qualified_name += ")";
          names[fn.name] = fully_qualified_name;
        }
        return names;
      };

      Web3RPC.prototype.contract = function(abi) {
        var Contract, createFunctionHandler, fully_qualified_name, names, prefix, web3rpc;
        web3rpc = this;
        Contract = (function() {
          Contract.prototype.web3rpc = web3rpc;

          function Contract(address) {
            this.address = address;
          }

          return Contract;

        })();
        createFunctionHandler = (function(_this) {
          return function(fully_qualified_name, abi) {
            web3rpc = _this;
            return function() {
              var args, callback, callfn, createDetailedHelper, params;
              callfn = (function(_this) {
                return function(method, params, tx_params, block, callback) {
                  var final_tx_params, key, value;
                  final_tx_params = {
                    to: _this.address
                  };
                  for (key in tx_params) {
                    value = tx_params[key];
                    final_tx_params[key] = value;
                  }
                  return web3rpc.call_or_transact(method, fully_qualified_name, abi, params, final_tx_params, block, callback);
                };
              })(this);
              args = Array.prototype.slice.call(arguments);
              if (typeof args[args.length - 1] === "function") {
                callback = args[args.length - 1];
              }
              if (callback != null) {
                params = args.splice(0, args.length - 1);
                return callfn("eth_call", params, {}, "latest", callback);
              } else {
                params = args;
                createDetailedHelper = function(method) {
                  return (function(_this) {
                    return function(tx_params, block, callback) {
                      var helper_name;
                      if (tx_params == null) {
                        tx_params = {};
                      }
                      if (block == null) {
                        block = "latest";
                      }
                      if (typeof tx_params === "string") {
                        callback = block;
                        block = tx_params;
                        tx_params = {};
                      }
                      if (typeof tx_params === "function") {
                        callback = tx_params;
                        tx_params = {};
                      }
                      if (typeof block === "function") {
                        callback = block;
                        block = "latest";
                      }
                      if ((callback == null) || typeof callback !== "function") {
                        helper_name = method.indexOf("send") >= 0 ? "send" : "call";
                        throw helper_name + "() function must be passed a callback!";
                      }
                      return callfn(method, params, tx_params, block, callback);
                    };
                  })(this);
                };
                return {
                  call: createDetailedHelper("eth_call"),
                  send: createDetailedHelper("eth_sendTransaction")
                };
              }
            };
          };
        })(this);
        names = this.fullyQualifyNames(abi);
        for (prefix in names) {
          fully_qualified_name = names[prefix];
          Contract.prototype[prefix] = createFunctionHandler(fully_qualified_name, abi);
        }
        return Contract;
      };

      return Web3RPC;

    })();
    return Web3RPC;
  };

  if ((typeof module !== "undefined" && module !== null) && (module.exports != null)) {
    module.exports = factory(require("web3"), require("xmlhttprequest").XMLHttpRequest);
  } else {
    window.Web3RPC = factory(web3, XMLHttpRequest);
  }

}).call(this);
