$(document).ready(function() {

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
    
    $("#makeDomoSubmit").on("click", (e) => {
        e.preventDefault();
    
        $("#domoMessage").animate({width:'hide'},350);
    
        console.log($("#weaponColor").val());
      
        if($("#domoName").val() == '' || $("#weaponColor").val() == '') {
            handleError("RAWR! All fields are required");
            return false;
        }

        sendAjax($("#domoForm").attr("action"), $("#domoForm").serialize());
        
        return false;
    });
  
  $(".deleteDomoSubmit").on("click", (e) => {
        e.preventDefault();
        console.log(e.target);
        var name = e.target.name;
        console.log(name);
    
        var data = e.target.parentElement;
        console.log(data.id);
        data.querySelector('[name="_csrf"]').value = $("#csrf")[0].value;
        data = $(data).serialize();
        console.log(data);
    
        var temp = 'name=' + name + '&_csrf=' + $("#csrf")[0].value;
        console.log(temp);

        sendAjax("/remove", temp);
        
        return false;
    });
  
  $(".activateDomoSubmit").on("click", (e) => {
        e.preventDefault();
    
        var data = e.target.parentElement;
        console.log(data.id);
        var color = data.id;
        data.querySelector('[name="_csrf"]').value = $("#csrf")[0].value;
        data = $(data).serialize();
        console.log(data);
    
        var temp = 'color=' + color + '&_csrf=' + $("#csrf")[0].value;
        console.log(temp);

        sendAjax("/activate", temp);
        
        return false;
    });

    $(".activatePlayerType").on("click", (e) => {
        e.preventDefault();

        var data = e.target.parentElement;
        const type = $("#playerType").val();
        console.log(type);

        if(!type) {
            return false;
        }
    
        data.querySelector('[name="_csrf"]').value = $("#csrf")[0].value;
        data = $(data).serialize();
        console.log("data: " + data);
    
        var temp = 'playerType=' + type + '&_csrf=' + $("#csrf")[0].value;
        console.log("temp: " + temp);

        sendAjax("/activateType", temp);
        
        return false;
    });

    $(".activateWeaponType").on("click", (e) => {
        e.preventDefault();

        var data = e.target.parentElement;
        const type = $("#weaponType").val();
        console.log(type);

        if(!type) {
            return false;
        }
    
        data.querySelector('[name="_csrf"]').value = $("#csrf")[0].value;
        data = $(data).serialize();
        console.log("data: " + data);
    
        var temp = 'weaponType=' + type + '&_csrf=' + $("#csrf")[0].value;
        console.log("temp: " + temp);

        sendAjax("/activateWeaponType", temp);
        
        return false;
    });
  
  $(".enterGameSubmit").on("click", (e) => {
        console.log("enter game button hit");
    
        e.preventDefault();
    
        console.dir(e.target.id);
    
        var name = e.target.name;
        console.log(name);
    
        var data = e.target.parentElement;
        console.log(data.id);
        data.querySelector('[name="_csrf"]').value = $("#csrf")[0].value;
        data = $(data).serialize();
        console.log(data);
    
        var temp = 'name=' + name + '&_csrf=' + $("#csrf")[0].value + '&dis=' + e.target.id;
        console.log(temp);

        sendAjax("/enterGame", temp);
        
        return false;
    });
    
});