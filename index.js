// index.js
var falcorExpress = require('falcor-express');
var Router = require('falcor-router');
var _ = require('underscore');

var express = require('express');
var app = express();

// this would be in a data store somewhere on the server
var datastore1 = {
    "docs": {
        1: {"id": 1, "user": 1, "filename": "bell_bill.pdf", "size": 73621},
        2: {"id": 2, "user": 1, "filename": "aws_bill.pdf", "size": 63291},
        3: {"id": 3, "user": 1, "filename": "github_bill.pdf", "size": 13521},
        4: {"id": 4, "user": 2, "filename": "rogers_bill.pdf", "size": 91921},
        5: {"id": 5, "user": 2, "filename": "azure_bill.pdf", "size": 83761}
    },
    "tags": {
        1: {
            "id": 1,
            "user": 1,
            "name": "work expenses",
            "documents": [1, 2, 3]
        },
        2: {
            "id": 2,
            "user": 1,
            "name": "internet",
            "documents": [2, 3]
        },
        3: {
            "id": 3,
            "user": 2,
            "name": "microsoft",
            "documents": [5]
        }
    }
}

var datastore2 = {
    "docs": {
        1: {"id": 1, "user": 1, "views": 41},
        2: {"id": 2, "user": 1, "views": 26},
        3: {"id": 3, "user": 1, "views": 51},
        4: {"id": 4, "user": 2, "views": 42},
        5: {"id": 5, "user": 2, "views": 93}
    }
}

var routes = [
    {
        route: 'documentsById[{integers:docIds}]["filename", "size"]',
        // Route handlers are run with the Router instance as their this object
        get: function(pathSet) {
            var docs,
                docIds,
                docKeys,
                results;

            if (this.userId == null) {
                throw new Error("not authorized");
            }  

            docs = [];
            docIds = pathSet[1];
            docKeys = pathSet[2];

            // this is our "DB" call
            docIds.forEach(function(id) {
                docs.push(datastore1.docs[id]);
            });

            // not sure what to do
            if (docs.length === 0) throw new Error ('oh god no');

            results = [];

            docIds.forEach(function(docId) {
                docKeys.forEach(function(docKey) {
                    console.log(docId, docKey);

                    results.push({
                        path: ['documentsById', docId, docKey],
                        value: _.where(docs, {id: docId})[0][docKey]
                    })
                });
            })

            return results;
        }
    },
    {
        route: 'documentsById[{integers:docIds}].views',
        // Route handlers are run with the Router instance as their this object
        get: function(pathSet) {
            var docs,
                docIds,
                docKeys,
                results;

            if (this.userId == null) {
                throw new Error("not authorized");
            }  

            docs = [];
            docIds = pathSet[1];
            docKeys = pathSet[2];

            // this is our "DB" call
            docIds.forEach(function(id) {
                docs.push(datastore2.docs[id]);
            });

            // not sure what to do
            if (docs.length === 0) throw new Error ('oh god no');

            results = [];
            docKeys = Array.isArray(docKeys) ? docKeys : [docKeys];

            docIds.forEach(function(docId) {
                docKeys.forEach(function(docKey) {
                    results.push({
                        path: ['documentsById', docId, docKey],
                        value: _.where(docs, {id: docId})[0][docKey]
                    })
                });
            })

            return results;
        }
    },
    {
        route: 'tagList[{integers:tagIds}].name',
        // Route handlers are run with the Router instance as their this object
        get: function(pathSet) {
            var tags,
                tagIds,
                tagKeys,
                results;

            if (this.userId == null) {
                throw new Error("not authorized");
            }  

            tags = [];
            tagIds = pathSet[1];
            tagKeys = pathSet[2];

            // this is our "DB" call
            tagIds.forEach(function(id) {
                tags.push(datastore1.tags[id]);
            });

            // not sure what to do
            if (tags.length === 0) throw new Error ('oh god no');

            results = [];
            tagKeys = Array.isArray(tagKeys) ? tagKeys : [tagKeys];

            tagIds.forEach(function(tagId) {
                tagKeys.forEach(function(tagKey) {
                    results.push({
                        path: ['tagList', tagId, tagKey],
                        value: _.where(tags, {id: tagId})[0][tagKey]
                    })
                });
            })

            return results;
        },
    },
    {
        route: 'tagList[{integers:tagIds}].documents[{integers:docIds}]',
        // Route handlers are run with the Router instance as their this object
        get: function(pathSet) {
            var tags,
                tagIds,
                docIds,
                results;

            // if (this.userId == null) {
            //     throw new Error("not authorized");
            // }  

            console.log(pathSet);

            tags = [];
            tagIds = pathSet[1];
            docIds = pathSet[3];

            // this is our "DB" call
            tagIds.forEach(function(id) {
                tags.push(datastore1.tags[id]);
            });

            console.log(tags);

            // not sure what to do
            if (tags.length === 0) throw new Error ('oh god no');

            results = [];
            docIds = Array.isArray(docIds) ? docIds : [docIds];

            tagIds.forEach(function(tagId) {
                docIds.forEach(function(docId) {
                    results.push({
                        path: ['tagList', tagId, 'documents', docId],
                        value: {$type: 'ref', value: ['documentsById', docId]}
                    })
                });
            })

console.log(results);
            return results;
        }
    }    
]
// Create a Router base class
var BaseRouter = Router.createClass(routes);

// Creating a constructor for a class that derives from BaseRouter
var HubdocRouter = function(userId){
    // Invoking the base class constructor
    BaseRouter.call(this);
    this.userId = userId;
};

// Deriving the NetflixRouter from the BaseRouter using JavaScript's classical inheritance pattern
HubdocRouter.prototype = Object.create(BaseRouter.prototype);

app.use('/model.json', falcorExpress.dataSourceRoute(function (req, res) {
    var userId = 1; // req.session.user.id, etc.

    return new HubdocRouter(userId) 
}));

// serve static files from current directory
app.use(express.static(__dirname + '/'));

var server = app.listen(3000);



var router = new Router(routes);

router.get([["tagList", [1, 2], ["documents"], [1, 2, 3]]]).subscribe(function(jsonGraph) {
    console.log(JSON.stringify(jsonGraph, null, 4));
});
