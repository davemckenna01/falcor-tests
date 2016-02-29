// index.js
var falcorExpress = require('falcor-express');
var Router = require('falcor-router');
var _ = require('underscore');
var sleep = require('sleep');

var express = require('express');
var app = express();

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));

// this would be in a data store somewhere on the server
var datastore1 = {
    "docs": [
        {"id": 1, "user": 1, "filename": "bell_bill.pdf", "size": 73621},
        {"id": 2, "user": 1, "filename": "aws_bill.pdf", "size": 63291},
        {"id": 3, "user": 1, "filename": "github_bill.pdf", "size": 13521},
        {"id": 4, "user": 2, "filename": "rogers_bill.pdf", "size": 91921},
        {"id": 5, "user": 2, "filename": "azure_bill.pdf", "size": 83761}
    ],
    "tags": [
        {"id": 1, "user": 1, "name": "work expenses", "documents": [1, 2, 3] },
        {"id": 2, "user": 1, "name": "internet", "documents": [2, 3] },
        {"id": 3, "user": 2, "name": "microsoft", "documents": [5] }
    ]
}

var datastore2 = {
    "docs": [
        {"id": 1, "user": 1, "views": 41},
        {"id": 2, "user": 1, "views": 26},
        {"id": 3, "user": 1, "views": 51},
        {"id": 4, "user": 2, "views": 42},
        {"id": 5, "user": 2, "views": 93}
    ]
}

function getItems (datastore, itemType) {
    return function (pathSet) {
        var items,
            itemIds,
            itemKeys,
            itemPropName,
            results;

        if (this.userId == null) {
            throw new Error("not authorized");
        }  

        console.log('getItems', pathSet);

        // pick out important parts of the request URL
        itemPropName = pathSet[0];
        itemIds = _.map(pathSet[1], function(id) {return parseInt(id);});
        itemKeys = Array.isArray(pathSet[2]) ? pathSet[2] : [pathSet[2]];

        // 1. get requested items constrained by user id (this is our "DB" call)
        items = _.chain(datastore[itemType])
                .where({user: this.userId})
                .filter(function(item) {return _.contains(itemIds, item.id) })
                .value();

        results = [];

        // 2. for each item id in the request, attempt to create a path
        itemIds.forEach(function(itemId) {
            var item;

            item = _.where(items, {id: itemId})[0];

            // WARNING! WE'RE NOT HANDLING DB CONNECTION ERRORS!
            if (!item) {
                results.push({
                    path: [itemPropName, itemId],
                    value: undefined
                });
            } else {
                itemKeys.forEach(function(itemKey) {
                    results.push({
                        // path is something like:
                        // documentsById[42].filename,
                        path: [itemPropName, itemId, itemKey],
                        value: item[itemKey]
                    });
                });
            }
        })

        return results;
    }
}

function getItemsChildren (datastore, itemType) {
    return function (pathSet) {
        var items,
            itemIds,
            itemPropName,
            childrenPropName,
            childIds,
            results;

        if (this.userId == null) {
            throw new Error("not authorized");
        }  

        console.log('getItemsChildren', pathSet);

        // pick out important parts of the request URL
        itemPropName = pathSet[0];
        itemIds = _.map(pathSet[1], function(id) {return parseInt(id);});
        childrenPropName = pathSet[2];
        childIds = _.map(pathSet[3], function(id) {return parseInt(id);});

        // 1. get requested items constrained by user id (this is our "DB" call)
        items = _.chain(datastore[itemType])
                .where({user: this.userId})
                .filter(function(item) {return _.contains(itemIds, item.id) })
                .value();

        results = [];

        // 2. for each item id in the request, attempt to create a path
        itemIds.forEach(function(itemId) {
            var item;

            item = _.where(items, {id: itemId})[0];

            if (!item) {
                results.push({
                    path: [itemPropName, itemId],
                    value: undefined
                });
            } else {
                childIds.forEach(function(childId) {
                    // WARNING! WE'RE NOT HANDLING DB CONNECTION ERRORS!
                    if ( _.contains(item[childrenPropName], childId) ) {
                        results.push({
                            // path is something like:
                            // tagList[42].documents[99],
                            path: [itemPropName, itemId, childrenPropName, childId],
                            value: {$type: 'ref', value: [childrenPropName + 'ById', childId]}
                        });
                    } else {
                        results.push({
                            // path is something like:
                            // tagList[42].documents[99],
                            path: [itemPropName, itemId, childrenPropName, childId],
                            value: undefined
                        });
                    }
                });
            }
        })

        return results;
    }
}

var routes = [
    {
        route: 'documentsById[{integers}]["filename", "size"]',
        get: getItems(datastore1, 'docs')
    },
    {
        route: 'documentsById[{integers}].views',
        get: getItems(datastore2, 'docs'),
        // this can be made more flexible to handle multiple ids, see Netflix's
        // demo for pattern
        set: function(jsonGraphArg) {
            var documentsById,
                docId,
                doc;

            console.log(jsonGraphArg.documentsById); 

            documentsById = jsonGraphArg.documentsById;

            // WARNING! ASSUMING ONLY ONE ITEM HERE!
            docId = Object.keys(documentsById)[0];

            // this is sloppy - how to handle string vs int ids in general with
            // Falcor?
            docId = parseInt(docId);

            // 1. set requested items (this is our "DB" call)
            doc = _.where(datastore2.docs, {id: docId})[0];
            if (doc) doc.views = documentsById[docId].views;

            // simulate slow network (in the lamest way possible)
            sleep.sleep(5)

            // simulate error setting on magic number
            if (documentsById[docId].views === 99) {
                return {
                    path: ['documentsById', docId, 'views'],
                    value: {$type: 'error', value: 'something failed'}
                }
            }

            // WARNING! WE'RE NOT HANDLING DB CONNECTION ERRORS!
            if (doc) {
                return {
                    path: ['documentsById', docId, 'views'],
                    value: doc.views
                }
            } else {
                return {
                    path: ['documentsById', docId],
                    value: undefined
                }
            }
        }
    },
    {
        route: 'tagList[{integers}].name',
        get: getItems(datastore1, 'tags')
    },
    {
        route: 'tagList[{integers}].documents[{integers}]',
        get: getItemsChildren(datastore1, 'tags')
    },
    {
        route: 'tagList[{integers}].documents.push',
        call: function(callPath, args) {
            var tagId,
                tag,
                docId;

            tagId = callPath[1][0];
            docId = args[0];

            // 1. add doc to list of docs for this tag (this is our DB call)
            tag = _.where(datastore1.tags, {id: tagId})[0];
            tag.documents.push(docId);

            return [{
                // return the path to, and value of, the newly created node
                path: ['tagList', tagId, 'documents', docId],
                value: { $type: "ref", value: ["documentsById", docId] }
            }]
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



// var router = new Router(routes);

// router.get([["tagList", [1, 2], ["documents"], [1, 2, 3]]]).subscribe(function(jsonGraph) {
//     console.log(JSON.stringify(jsonGraph, null, 4));
// });
