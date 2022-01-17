chrome.runtime.onMessage.addListener(async (msg) => {
    console.log(msg)
    const contact = parse(msg.raw)
    if (contact == null) return
    console.log(contact)
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        console.log(tabs[0])
        chrome.tabs.sendMessage(tabs[0].id, {contact: contact})
    })
})

function sendPopup(str) {
    console.log(str)
}

function parse(str) {
    const reFields = /(.+)\t(\d{3}-\d{3}-\d{4})\t(.+)\t(\w+@.+)/g

    let reResults = str.matchAll(reFields)
    let fields = {}

    // Initial parsing
    for (const match of reResults) {
        if (match.length !== 5) {
            sendPopup("Invalid number of groups")
            console.log(str)
            console.log(match)
            return null
        }
        fields.name = match[1]
        fields.phone = match[2]
        fields.address = match[3]
        fields.email = match[4]
    }
    if (!('name' in fields)) {
        sendPopup("No information found")
        console.log(str)
        return null
    }

    // Parse name
    // Not needed, lol
    // const reName = /(.+),\s?(.+)/g
    // reResults = fields.name.matchAll(reName)
    // for (const match of reResults) {
    //     if (match.length !== 3) {
    //         sendPopup("Invalid name")
    //         console.log(str)
    //         console.log(match)
    //         return null
    //     }
    //     fields.firstName = match[1]
    //     fields.lastName = match[2]
    // }
    // if (!('firstName' in fields)) {
    //     sendPopup("Missing name information")
    //     console.log(str)
    //     return null
    // }

    // Parse address
    // Expected : number, street, Unit (OP), City, Province, Country, ZIP
    const addressFields = fields.address.split(",")
    if (addressFields.length !== 6 && addressFields.length !== 7) {
        sendPopup("Invalid address format")
        console.log(str)
        console.log(fields.address)
    }

    const addressFieldsMap = {
        6: ["number", "street", "city", "province", "country", "zip"],
        7: ["number", "street", "unit", "city", "province", "country", "zip"],
    }
    const addressMap = addressFieldsMap[addressFields.length]
    for (let i = 0; i < addressFields.length; ++i) {
        fields[addressMap[i]] = addressFields[i].trim()
    }

    return fields
}