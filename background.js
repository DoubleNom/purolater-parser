chrome.runtime.onMessage.addListener(async (msg) => {
    const contact = parse(msg.raw)
    if (contact == null) return
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {contact: contact})
    })
})

function sendPopup(str) {
    console.log(str)
}

function parse(str) {

    let reResults = str.split('\t');
    let fields = {}

    // Initial parsing
    if (reResults.length !== 4) {
        sendPopup("Invalid number of groups")
        console.log(str)
        console.log(reResults)
        return null
    }
    fields.name = reResults[0]
    fields.phone = reResults[1]
    fields.address = reResults[2]
    fields.email = reResults[3]
    if (!('name' in fields)) {
        sendPopup("No information found")
        console.log(str)
        console.log(fields)
        return null
    }

    // Parse phone
    const rePhone = /\+?1?\s?(\(?\d{3}\)?)(?:\s|-)?(\d{3}(?:\s|-)?\d{4})$/gi
    reResults = fields.phone.matchAll(rePhone)
    for (const match of reResults) {
        if (match.length !== 3) {
            sendPopup("Invalid phone number")
            console.log(match)
            console.log(str)
        }
        fields.phoneArea = match[1].replaceAll("(","").replaceAll(")","")
        fields.phoneNumber = match[2].replaceAll("(","").replaceAll(")","")
        // add missing hypen if required
        if (fields.phoneNumber.length === 7) {
            fields.phoneNumber = fields.phoneNumber.slice(0, 3) + '-' + fields.phoneNumber.slice(3)
        }
    }
    if (!('phoneArea' in fields)) {
        sendPopup("Invalid phone number")
        console.log(str)
        console.log(fields.phone)
    }

    parseAddress(fields)

    return fields
}

function parseAddress(fields) {
    const addressFields = fields.address.split(",")
    if (addressFields.length < 4) {
        sendPopup("Invalid address, too few fields")
        console.log(fields.address)
        return
    }

    // get at least the number
    const reSimpleNumber = /^((?:\d|b|\s?bis|t|\s?ter)+)$/gi
    const reNumberWithUnit = /^(\d+)-((?:\d|b|\s?bis|t|\s?ter)+)$/gi
    const reSimpleNumberWithAddress = /^((?:\d|b|\s?bis|t|\s?ter)+)\s(.+)$/gi
    const reNumberWithUnitWithAddress = /^(\d+)-((?:\d|b|\s?bis|t|\s?ter)+)\s(.+)$/gi
    const reNumberSuffixSpace = /\d+\s(bis|ter)/gi
    const initialField = addressFields[0].trim()
    const hasSpaceSuffix = !!initialField.match(reNumberSuffixSpace)

    if (initialField.match(reSimpleNumber)) {
        fields.number = initialField
    }
    // Check if it's a number with unit
    else if (initialField.match(reNumberWithUnit)) {
        const split = initialField.split('-')
        fields.number = split[0]
        fields.unit = split[1]
    } else if (initialField.match(reSimpleNumberWithAddress)) {
        const split = initialField.split(' ')
        if (hasSpaceSuffix) {
            fields.number = split[0] + ' ' + split[1]
            fields.street = split.slice(2).join(" ")
        } else {
            fields.number = split[0]
            fields.street = split.slice(1).join(" ")
        }
    } else if (initialField.match(reNumberWithUnitWithAddress)) {
        const splitAddress = initialField.split(' ')
        if (hasSpaceSuffix) {
            splitAddress[0] = splitAddress[0] + ' ' + splitAddress[1]
            splitAddress[1] = splitAddress[2]
        } else {
            splitAddress[1] = splitAddress.slice(1).join(" ")
        }
        const splitNumbers = splitAddress[0].split('-')
        console.log(initialField)
        console.log(splitAddress)
        console.log(splitNumbers)
        fields.street = splitAddress[1]
        fields.number = splitNumbers[1]
        fields.unit = splitNumbers[0]
    }

    let index = 1;

// Street
    if (!('street' in fields)) {
        fields.street = addressFields[index++].trim();
    }

// Unit (optional)
    const reUnit = /^((?:apt|app|#|unit)\s?\d+)$/gi
    let reResult = addressFields[index].trim().match(reUnit)
    if (reResult) {
        fields.unit = reResult[0]
        ++index
    }
    if ('unit' in fields) {
        if(!!fields.unit.match(/^\d+$/gi)) {
            fields.unit = "apt " + fields.unit
        }
    }

// remaining fields are mandatory
    const rf = ["city", "province", "country", "zip"]
    const rs = addressFields.slice(index)
    for (let i = 0; i < rf.length; ++i) {
        fields[rf[i]] = rs[i].trim()
    }

}