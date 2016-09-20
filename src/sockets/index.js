"use strict";
const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const Promise = require('bluebird');

class HubSocket {
    constructor(config) {

    }
}
var socket, context, pendingRequests;
pendingRequests = [];


module.exports = {
    use: function (config) {
        context = config;
        socket = io(context.hubUrl);

        socket.on('connect', (ev) => {
            console.log('Connected to ' + context.hubUrl);
            this.emit('register', { package: context.packageId, contents: {} });
        });

        socket.on('response', (contents) => {
            for (var i = 0; i < pendingRequests.length; i++) {
                if (pendingRequests[i].__id === contents.id) {
                    pendingRequests[i].resolve(contents);
                    pendingRequests.splice(i, 1);
                    return;
                }
            }
        });
        socket.on('error', (contents) => {
            for (var i = 0; i < pendingRequests.length; i++) {
                if (pendingRequests[i].__id === contents.id) {
                    pendingRequests[i].reject(contents);
                    pendingRequests.splice(i, 1);
                    return;
                }
            }
        });

    },

    //THIS METHOD HAS NOT BEEN TESTED TO WORK CORRECTLY
    requestAsync: function (to, payload) {
        var req = {
            id: pendingRequests.length + 1,
            to: to,
            package: context.packageId,
            contents: payload
        };

        var promise = new Promise();
        promise.__id = req.id;
        pendingRequests.push(promise);
        this.emit("request", req);
        return promise;

    },
    emit: function (type, payload) {

        //Wraps the emit function to sign the contents.
        //The server only retransmits signed payloads.
        //This should prevent spam in the socket.
        payload = jwt.sign(payload, context.secret);
        socket.emit(type, { contents: payload, package: context.packageId });
    },
    on: function (type, callback) {
        socket.on(type, callback);
    }
};


