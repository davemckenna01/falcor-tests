var jsonGraph = {
    "jsonGraph": {
        "documentsById": {
            "1": {"filename":"bell_bill.pdf", "size":73621 },
            "2": {"filename":"aws_bill.pdf", "size":63291 },
            "3": {"filename":"github_bill.pdf", "size":13521 }
        },
        "tagList": {
            "1": {
                "name": "work expenses",
                "documents": [
                    { $type: "ref", value: ["documentsById", 1]},
                    { $type: "ref", value: ["documentsById", 2]},
                    { $type: "ref", value: ["documentsById", 3]}
                ]
            }
        }
    },
}

var model = new falcor.Model({source: new falcor.HttpDataSource('/model.json') });

model.get('tagList[1].documents[0].filename')
.then(function(response) {
    console.log(response) // bell_bill.pdf
})

model.get('tagList[1].documents[0].filename', 'BELL_BILL!!!.pdf')
.then(function(response) {
    console.log(response) // BELL_BILL!!!.pdf
})
