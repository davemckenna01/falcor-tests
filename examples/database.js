// client side: old way

var json = {
    "docs": {
        1: {"id": 1, "user": 1, "filename": "bell_bill.pdf", "size": 73621},
        2: {"id": 2, "user": 1, "filename": "aws_bill.pdf", "size": 63291},
        3: {"id": 3, "user": 1, "filename": "github_bill.pdf", "size": 13521}
    },
    "tags": {
        1: {
            "id": 1,
            "user": 1,
            "name": "work expenses",
            "documents": [
                {"id": 1, "user": 1, "filename": "bell_bill.pdf", "size": 73621},
                {"id": 2, "user": 1, "filename": "aws_bill.pdf", "size": 63291},
                {"id": 3, "user": 1, "filename": "github_bill.pdf", "size": 13521}
            ]
        },

        ...
    }
}