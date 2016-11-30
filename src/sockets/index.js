"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var io = require('socket.io-client');
var jwt = require('jsonwebtoken');
var Promise = require('bluebird');
var uuidv4 = require('uuid/v4');

var HubSocket = function HubSocket(config) {
    _classCallCheck(this, HubSocket);
};

var socket, context, pendingRequests;
pendingRequests = {};

module.exports = {
    use: function use(config) {
        var _this = this;

        context = config;
        socket = io(context.hubUrl);

        socket.on('connect', function (ev) {
            console.log('Connected to ' + context.hubUrl);
            _this.emit('register', { package: context.packageId, contents: {} });
        });

        socket.on('response', function (contents) {
            if(pendingRequests[contents.id]){
              pendingRequests[contents.id](contents)
              delete pendingRequests[contents.id]
            }
        });
        socket.on('error', function (contents) {
           if(pendingRequests[contents.id]){
              pendingRequests[contents.id](contents)
              delete pendingRequests[contents.id]
            }
        });
    },

    //THIS METHOD HAS NOT BEEN TESTED TO WORK CORRECTLY
    requestAsync: function requestAsync(to, payload, callback) {
        var req = {
            id: uuidv4(),
            to: to,
            package: context.packageId,
            contents: payload
        };

        
        pendingRequests[req.id] = callback;
        this.emit("request", req);
        
    },
    emit: function emit(type, payload) {

        //Wraps the emit function to sign the contents.
        //The server only retransmits signed payloads.
        //This should prevent spam in the socket.
        payload = jwt.sign(payload, context.secret);
        socket.emit(type, { contents: payload, package: context.packageId });
    },
    on: function on(type, callback) {
        socket.on(type, callback);
    }
};
