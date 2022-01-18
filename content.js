chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    fill(msg.contact)
})

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
        phoneArea: "ctl00_CPPC_ToAd_txtPhoneArea",
        phoneNumber: "ctl00_CPPC_ToAd_txtPhone",
        unit: "ctl00_CPPC_ToAd_txtAddress2"
    }
    for (const id in purolatorId) {
        if (!(id in contact)) continue
        let field = document.getElementById(purolatorId[id])
        field.value = contact[id]
    }
}