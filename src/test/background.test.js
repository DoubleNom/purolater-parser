const parser = require("../background")

test('Address Parsing', () => {
    const addresses = [
        {
            expect: {
                number: "1234",
                street: "Rue du truc",
                city: "Québec",
                province: "QC",
                country: "CA",
                zip: "A1A 1A1"
            },
            input:
                "1234, Rue du truc, Québec, QC, CA, A1A 1A1"
        },
        {
            expect: {
                number: "1234",
                street: "Rue du truc",
                city: "Québec",
                province: "QC",
                country: "CA",
                zip: "A1A 1A1"
            },
            input:
                "1234, Rue du truc, Québec, QC, CA, A1A1A1"
        },
        {
            expect: {
                number: "1234",
                street: "Rue du truc",
                city: "Québec",
                province: "QC",
                country: "CA",
                zip: "A1A 1A1"
            },
            input:
                "1234, Rue du truc, Québec, QC, CA, A1A1A1 je rajoute de la merde"
        },
        {
            expect: {
                number: "1234",
                street: "Rue du truc",
                city: "Québec",
                province: "QC",
                country: "CA",
                zip: "A1A 1A1"
            },
            input:
                "1234, Rue du truc, Québec, QC, CA, a1a1a1"
        },
        {
            expect: {
                number: "1234",
                street: "Rue du truc",
                city: "Québec",
                unit: "apt 42",
                province: "QC",
                country: "CA",
                zip: "A1A 1A1"
            },
            input:
                "42-1234, Rue du truc, Québec, QC, CA, A1A 1A1"
        },
        {
            expect: {
                number: "1234",
                street: "Rue du truc",
                city: "Québec",
                unit: "apt 42",
                province: "QC",
                country: "CA",
                zip: "A1A 1A1"
            },
            input:
                "42-1234 Rue du truc, Québec, QC, CA, A1A 1A1"
        },
        {
            expect: {
                number: "1234",
                street: "Rue du truc",
                city: "Québec",
                unit: "apt42",
                province: "QC",
                country: "CA",
                zip: "A1A 1A1"
            },
            input:
                "1234 Rue du truc, apt42, Québec, QC, CA, A1A 1A1"
        },
        {
            expect: {
                number: "1234",
                street: "Rue du truc",
                city: "Québec",
                unit: "#42",
                province: "QC",
                country: "CA",
                zip: "A1A 1A1"
            },
            input:
                "1234, Rue du truc, #42, Québec, QC, CA, A1A 1A1"
        },

    ]
    const compare = ["number", "street", "unit", "city", "province", "country", "zip",]

    for (const address of addresses) {
        let obj = {address: address.input}
        parser.parseAddress(obj)
        console.log(obj)
        for (const field of compare) {
            if (field === "unit" && !(field in address.expect)) continue
            expect(field in obj).toBe(true)
            expect(obj[field]).toBe(address.expect[field])
        }
    }
})