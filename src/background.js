if (typeof chrome !== 'undefined') {
    chrome.runtime.onMessage.addListener(onMessageCallback)
    navigator.language
}


function i18nString(en, fr) {
    if (navigator.language.includes("en")) return en;
    else return fr;
}

function onMessageCallback(msg, _, callback) {
    if (callback != null) callback();

    // Get input from user by popup.js
    sendPopup(msg.raw);
    const contact = parse(msg.raw)
    if (contact == null) {
        sendPopup(i18nString("Contact is null, aborting", "Contact est vide, annulation"), true);
        return false;
    }
    sendPopup(contact);
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const activeTab = tabs[0];
        if (activeTab == null || activeTab.id == null) {
            console.log("No tab here")
            return false;
        }
        chrome.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: fill,
            args: [contact]
        })
    });
    return false;
}

function print(obj, isAlert = false) {
    if(isAlert) {
        alert(obj)
    }
    console.log(obj)
}

function sendPopup(str, isAlert = false) {
    console.log(str);
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const activeTab = tabs[0];
        if (activeTab == null || activeTab.id == null) {
            console.log("No tab here")
            return false;
        }
        chrome.scripting.executeScript({
            target: {tabId: activeTab.id},
            func: print,
            args: [str, isAlert]
        })
    });
}

function parse(str) {
    let reResults = str.split('\t');
    let fields = {}

    // Initial parsing
    if (reResults.length !== 4) {
        sendPopup(i18nString("Invalid number of groups", "Nombre de groupe erroné"), true)
        sendPopup(str)
        sendPopup(reResults)
        return null
    }
    fields.name = reResults[0]
    fields.phone = reResults[1]
    fields.address = reResults[2]
    fields.email = reResults[3]
    if (!('name' in fields)) {
        sendPopup(i18nString("No information found", "Aucune information trouvée"), true)
        sendPopup(str)
        sendPopup(fields)
        return null
    }

    // Parse phone
    const rePhone = /\+?1?\s?(\(?\d{3}\)?)(?:\s|-)?(\d{3}(?:\s|-)?\d{4})$/gi
    reResults = fields.phone.matchAll(rePhone)
    for (const match of reResults) {
        if (match.length !== 3) {
            sendPopup(i18nString("Invalid phone number", "Numéro de téléphone invalide"), true)
            sendPopup(match)
            sendPopup(str)
        }
        fields.phoneArea = match[1].replaceAll("(", "").replaceAll(")", "")
        fields.phoneNumber = match[2].replaceAll("(", "").replaceAll(")", "")
        // add missing hypen if required
        if (fields.phoneNumber.length === 7) {
            fields.phoneNumber = fields.phoneNumber.slice(0, 3) + '-' + fields.phoneNumber.slice(3)
        }
    }
    if (!('phoneArea' in fields)) {
        sendPopup(i18nString("Invalid phone number", "Numéro de téléphone invalide"), true)
        sendPopup(str)
        sendPopup(fields.phone)
    }

    return parseAddress(fields)
}

function parseAddress(fields) {
    const addressFields = fields.address.split(",")
    if (addressFields.length < 4) {
        sendPopup(i18nString("Invalid address, too few fields", "Adresse invalide, des champs sont manquants"), true)
        sendPopup(fields.address)
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
        fields.number = split[1]
        fields.unit = split[0]
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
        if (!!fields.unit.match(/^\d+$/gi)) {
            fields.unit = "apt " + fields.unit
        }
    }

// remaining fields are mandatory
    const rf = ["city", "province", "country", "zip"]
    const rs = addressFields.slice(index)
    for (let i = 0; i < rf.length; ++i) {
        if (rs[i] == null || rs[i] === "") {
            sendPopup(
                i18nString(`Invalid address, ${rf[i]} field is missing. Check if the whole address is properly formatted`,
                    `Adresse invalide, le champs ${rf[i]} est manquant. Vérifiez l'adresse complete si elle est correctement formatée`), true)
            return null
        }
        fields[rf[i]] = rs[i].trim()
    }

    // Format zip
    fields.zip = fields.zip.toUpperCase().replaceAll(" ", "")
    fields.zip = fields.zip.slice(0, 3) + " " + fields.zip.slice(3, 6)

    return fields
}

function fill(contact) {
    const purolatorIdSend = {
        name: "ctl00_CPPC_ToAd_txtName",
        city: "ctl00_CPPC_ToAd_txtCity",
        country: "ctl00_CPPC_ToAd_ddlCountry",
        zip: "ctl00_CPPC_ToAd_txtPostalZipCode",
        province: "ctl00_CPPC_ToAd_ddlProvince",
        number: "ctl00_CPPC_ToAd_txtStreetNumber",
        street: "ctl00_CPPC_ToAd_txtStreetName",
        email: "ctl00_CPPC_ToAd_txtEmail",
        phoneArea: "ctl00_CPPC_ToAd_txtPhoneArea",
        phoneNumber: "ctl00_CPPC_ToAd_txtPhone",
        unit: "ctl00_CPPC_ToAd_txtAddress2"
    }
    const purolatorIdFrom = {
        name: "ctl00_CPPC_FrAd_txtName",
        city: "ctl00_CPPC_FrAd_txtCity",
        country: "ctl00_CPPC_FrAd_ddlCountry",
        zip: "ctl00_CPPC_FrAd_txtPostalZipCode",
        province: "ctl00_CPPC_FrAd_ddlProvince",
        number: "ctl00_CPPC_FrAd_txtStreetNumber",
        street: "ctl00_CPPC_FrAd_txtStreetName",
        email: "ctl00_CPPC_FrAd_txtEmail",
        phoneArea: "ctl00_CPPC_FrAd_txtPhoneArea",
        phoneNumber: "ctl00_CPPC_FrAd_txtPhone",
        unit: "ctl00_CPPC_FrAd_txtAddress2"
    }
    const purolatorIds = [purolatorIdSend, purolatorIdFrom];
    for (const purolatorId of purolatorIds) {
        for (const id in purolatorId) {
            if (!(id in contact)) continue
            let field = document.getElementById(purolatorId[id])
            if (field != null) field.value = contact[id]
        }
    }
}

// For unit testing
if (typeof module !== 'undefined') {
    module.exports.parseAddress = parseAddress
}
