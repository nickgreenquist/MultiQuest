$(document).ready(() => {

    const handleError = (message) => {
        $("#errorMessage").text(message);
        $("#domoMessage").animate({width:'toggle'},350);
    }
    
    const sendAjax = (action, data) => {
        $.ajax({
            cache: false,
            type: "POST",
            url: action,
            data: data,
            dataType: "json",
            success: (result, status, xhr) => {
                $("#domoMessage").animate({width:'hide'},350);

                window.location = result.redirect;
            },
            error: (xhr, status, error) => {
                const messageObj = JSON.parse(xhr.responseText);
            
                handleError(messageObj.error);
            }
        });        
    }
    
    $("#signupSubmit").on("click", (e) => {
        e.preventDefault();
    
        $("#domoMessage").animate({width:'hide'},350);
    
        if($("#user").val() == '' || $("#pass").val() == '' || $("#pass2").val() == '') {
            handleError("RAWR! All fields are required");
            return false;
        }
        
        if($("#pass").val() !== $("#pass2").val()) {
            handleError("RAWR! Passwords do not match");
            return false;           
        }

        sendAjax($("#signupForm").attr("action"), $("#signupForm").serialize());      
        return false;
    });

    $("#loginSubmit").on("click", (e) => {
        e.preventDefault();
    
        $("#domoMessage").animate({width:'hide'},350);
    
        if($("#user").val() == '' || $("#pass").val() == '') {
            handleError("RAWR! Username or password is empty");
            return false;
        }
    
        sendAjax($("#loginForm").attr("action"), $("#loginForm").serialize());
        return false;
    });

    $("#quitButton").on("click", (e) => {
        console.log("updating redis after leaving game");
        e.preventDefault();

        let data = '';
        data += 'level=' + players[user].level;
        data += '&' + 'maxHealth=' + players[user].maxHealth;
        data += '&' + 'attack=' + players[user].attack;
        data += '&' + 'speed=' + players[user].speed;
        data += '&' + 'exp=' + players[user].exp;
        data += '&' + 'points=' + players[user].points;
        data += '&' + 'maxDistance=' + players[user].maxDistance;
        data += '&' + 'spellPower=' + players[user].spellPower;
        data += '&' + 'playerType=' + players[user].type;
        data += '&' + 'weaponType=' + players[user].weaponType;
        data += '&' + '_csrf=' + $('#csrf').val();

        console.log(data);

        quit();

        $.ajax({
            cache: false,
            type: "POST",
            url: '/save',
            data: data,
            dataType: "json",
            success: (result, status, xhr) => {
                console.log("success");
            },
            error: (xhr, status, error) => {
                console.log("error");
            }
        });  
    });
});