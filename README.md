### Why Web3RPC? 

As of this writing, web3.js uses a lot of synchronous web requests by default, some that can’t be avoided. In web browsers as well as server applications, this will halt execution until the request completes -- which is bad news for user interfaces and fast response times. Web3RPC creates a way around this, as well as adding *small* additions to contract abstraction (see below).

An example where synchronous calls manifest:

```
var MyContract = web3.eth.contract(abi);
var instance = new MyContract(contract_address);
instance.getBalance() // Two synchronous requests are made here!
```

When all internet connections are working properly and eth clients exist on the same network, the above code should execute with no issue and with minimal impact on javascript execution. However, that’s a tall order, and is likely not going to be the case. In quick tests, when web3.js can’t connect to an eth client, execution is halted for at least a handful of seconds if not more.

I don’t expect Web3RPC to live on for the eternity of Ethereum. In fact, I’m confident that web3.js will eventually support asynchronous calls and callbacks throughout the codebase, making Web3RPC irrelevant. Until then, though, Web3RPC should be a good stand in for communicating with your Ethereum contracts.

### Installing Web3RPC

Web3RPC works in both node and in the browser.

##### Node

```
$ npm install web3rpc
```

And in your code, require the package:

```
var Web3RPC = require("web3rpc");
```

##### Browser

Web3RPC relies on web3.js. Make sure you include that first:

```
<script src="/web3.js"></script>
<script src="/web3rpc.js"></script>
```
### Using Web3RPC

You’ll need to start by creating a new instance, passing in the host and port of your Ethereum client. This is similar to creating a provider in web3.js, but there’s no need to set the provider globally:

```
var rpc = new Web3RPC("172.72.0.7:8545");
```

There are two methods you’ll want to use primarily:

##### send(method, params, callback)

Send a method to your eth client over the RPC protocol. All available methods and their expected parameters are detailed [here](https://github.com/ethereum/wiki/wiki/JSON-RPC).

* `method`: Method you want send to the JSON RPC interface. Example methods are “eth_coinbase” and “eth_sendTransaction”
* `params`: An array of parameters to send the method. You specify this array in the exact same way as the RPC method you want to call expects.
* `callback`: function(error, result) {}. A function that takes an `error` object and a `result` object. If an error occurs making the request, or if the JSON RPC returns an error result, `error` will be populated; otherwise it is null. On a successful request, `result` is populated with the value returned by the eth client.

##### contract(abi)

Like `web3.eth.contract()`, this function takes in an ABI and creates a class that you can use to easily interface with your contracts on the Ethereum network. Creating a contract class is easy:

```
var MyContractClass = rpc.contract(some_abi);
```

From there, you can create an instance of the class that represents the contract at a specific address:

```
var myContract = new MyContractClass(contract_address);
```

The above will create an object (`myContract`) that has methods that coincide with those in your contract, as described by the ABI. These methods are very similar to the ones created by `web3.eth.contract`, except all requests are made asynchronously, and all methods expect the last argument to be a callback. For instance, if you wanted to call the Ethereum client to get a coin balance for your address, you might perform the following:

```
myContract.getBalance(function(err, result) {
    console.log(err, result.valueOf());
});
```

Note that in the background Web3RPC sends an `eth_call` request, and formats the result object in the exact same way a contract created with `web3.eth.contract` would. As well -- and as you might expect -- the above method does not make a transaction that persists on the blockchain. 

Making a persistent transaction on contract is slightly different than web3.js, but with a few added features. First, consider this code:

```
myContract.sendCoin(receiver_address, amount, function(err, result) {
    console.log(err, result.valueOf());
});
```

The above code would pass the receiver address and the amount of coin to send to that reciever, and then run the callback when finished. However, this would simply make a call to the blockchain (i.e., `eth_call`), rather than a transaction (i.e., `eth_sendTransaction`). To send a transaction, you’ll want to **leave off** the callback to `sendCoin()` and instead pass only the function arguments with no callback. That will return an object which you can then send the transaction, like so:

```
myContract.sendCoin(receiver_address, amount).send({gas: ...}, function(err, result) {
    console.log(err, result);
});
```

The main benefit with this syntax over web3.js is that you can specify the parameters of the `eth_sendTransaction` function, such as `gas`, `gasPrice`, `from`, etc.; however, this first argument is optional. Since this is a transaction, the result of the callback function will be the address returned by the JSON RPC, so there’s no way to know the return value as the transaction created will not have been mined.

### Building Web3RPC

To convert the CoffeeScript source into a JavaScript file that can be used in the browser, just run the following: 

```
$ grunt
```

This will produce two files in `./dist`, one minified, one not, that you can use for production and development.


### License

MIT

### Contribute!

Fork the repostory and submit pull requests. Contributors welcome!