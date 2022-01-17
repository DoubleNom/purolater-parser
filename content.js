chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log(msg)
    fill(msg.contact)
})

console.log("content")

function fill(contact) {
    console.log(contact)
    const purolatorId = {
        name: "ctl00_CPPC_ToAd_txtName",
        city: "ctl00_CPPC_ToAd_txtCity",
        country: "ctl00_CPPC_ToAd_ddlCountry",
        zip: "ctl00_CPPC_ToAd_txtPostalZipCode",
        province: "ctl00_CPPC_ToAd_ddlProvince",
        number: "ctl00_CPPC_ToAd_txtStreetNumber",
        street: "ctl00_CPPC_ToAd_txtStreetName",
        email: "ctl00_CPPC_ToAd_txtEmail",
    }
    for (const id in purolatorId) {
        console.log(id)
        console.log(purolatorId[id])
        let field = document.getElementById(purolatorId[id])
        console.log(field)
        console.log(contact[id])
        field.value = contact[id]
    }
}