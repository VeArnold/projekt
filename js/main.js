let selectedGame;
let selectedBoardGame;
let selectedGamemode;
let selectedSubGamemode;
let selectedRanks = new Set();
let selectedTeamSize;

window.addEventListener('load', function() {
    readGameConfig()
    let button = document.getElementById("addNewGroup");
    button.addEventListener("click", function() {
        addNewGroup();
    }, false);
});

function addNewGroup() {
    let modal = document.getElementById("addGame").classList.toggle("visible");
}

function readGameConfig() {
    let url = getBaseUrl() + "data/gameConfig.json";
    readGameConfigFile(url);
}

function createGameButtons(data) {
    // Find the parent for the game buttons
    parent = document.getElementById("gameButtonsContainer")

    // Generate the HTML for the buttons
    let html = "";
    data.videoGames.forEach(game => {
        html += `
        <input class="filterButton gameFilter" id=\"${game.id + "Button"}\" type=\"button\" value=\"${game.name}"/>
            `;
    });
    html += `
        <input class="filterButton gameFilter" id=\"boardGamesButton\" type=\"button\" value=\"Lauamängud"/>
            `;

    // Populate the parent with the new HTML
    parent.innerHTML = html;

    // Create eventlisteners
    data.videoGames.forEach(game => {
        let button = document.getElementById(game.id + "Button");
        // Gamemodes exist for this game
        if (game.gamemodes.length > 0) {
            button.addEventListener("click", function() {
                selectedGame = game.id;
                buttonClicked(button, "gameFilter");
                createGamemodeFilter(game);
            }, false);
        }
        // Gamemodes don't exist, check if ranks exist
        else {
            // Ranks do exist, create rank filters next
            if ((game.ranks != null) && (game.ranks.length > 0) || (game.numericalRanks === true)) {
                button.addEventListener("click", function() {
                    // Remove previous filters that might be on the page (since we start from lower than usual hierarchy).
                    removeUnneccessaryFilters(true, true, true, true, true);

                    selectedGame = game.id;
                    buttonClicked(button, "gameFilter");
                    createRankFilter(game);
                    }, false);
            }
            else {
                // Ranks don't exist, create team size filter instead
                button.addEventListener("click", function() {
                    // Remove previous filters that might be on the page (since we start from lower than usual hierarchy).
                    removeUnneccessaryFilters(true, true, true, true, true);

                    selectedGame = game.id;
                    buttonClicked(button, "gameFilter");
                    createTeamSizeFilter(game);
                    }, false);
            }
        }
    });

    // Add listener also for board games
    let button = document.getElementById("boardGamesButton");
    button.addEventListener("click", function() {
        selectedGame = "boardGame";
        buttonClicked(button, "gameFilter");
        createBoardGameList(data.boardGames);
        }, false);
}

function createGamemodeFilter(game) {
    // Remove previously created gamemode and lower filters
    removeUnneccessaryFilters(gamemode=true, true, true, true, true);

    // Find parent
    var parent = document.getElementById("gamemodeFilters");

    // Create HTML with buttons
    html = "";
    game.gamemodes.forEach(gamemode => {
        html += `
            <input class="filterButton gamemodeFilter" id=\"${game.id + gamemode.id + "Button"}\" type=\"button\" value=\"${gamemode.name}"/>
        `
    });

    // Append new HTML to parent
    parent.innerHTML = html;

    // Create eventlisteners
    game.gamemodes.forEach(gamemode => {
        let button = document.getElementById(game.id + gamemode.id + "Button");
        // Subgamemodes don't exist
        if (gamemode.subGamemodes == null || gamemode.subGamemodes.length === 0) {
            // Ranks exist
            if ((game.ranks.length > 0) || (game.numericalRanks === true)) {
                button.addEventListener("click", function() {
                    selectedGamemode = gamemode.id;
                    buttonClicked(button, "gamemodeFilter");
                    createRankFilter(game);
                    }, false)
            }
            else {
                // Ranks don't exist
                button.addEventListener("click", function() {
                    selectedGamemode = gamemode.id;
                    buttonClicked(button, "gamemodeFilter");
                    createTeamSizeFilter(game);
                    }, false)
            }
        }
        // Subgamemodes exist as well
        else {
            button.addEventListener("click", function() {
                selectedGamemode = gamemode.id;
                buttonClicked(button, "gamemodeFilter");
                createSubGamemodeFilter(game, gamemode.subGamemodes);
                }, false)
        }
    })
}

function createRankFilter(game) {
    // Remove previously created rank and lower filters
    removeUnneccessaryFilters(gamemode = false, subGamemode = false, rank = true, teamsize = true, true);

    // Find parent
    let parent = document.getElementById("rankFilters");

    // Create HTML with buttons
    let html = "";
    let i = 0;
    game.ranks.forEach(rank => {
        html += `
            <div class="rankFilter checkBoxButton" id=\"${game.id + "Rank" + i.toString() + "Button"}\">${rank}</div>
        `;
        i++;
    });
    parent.innerHTML = html;

    // Add listeners for buttons to toggle state
    i = 0;
    game.ranks.forEach(rank => {
        let rankButton = document.getElementById(game.id + "Rank" + i.toString() + "Button");
        rankButton.addEventListener("click", function() {
            addOrRemoveRank(rank, rankButton);
        });
        i++;
    });

    // Create teamsize filter along with rank filter
    createTeamSizeFilter(game);
}

function createTeamSizeFilter(game, boardGame) {
    // Remove previously created teamsize  filters
    if ((game.gamemodes == null || game.gamemodes.length === 0) && (game.ranks == null || game.ranks.length === 0) && game.numericalRanks === false) {
        // In case we don't have any other data than team size, we need to remove all modes (otherwise boardgames will stay on the page)
        removeUnneccessaryFilters(false, false, false, true, true);
    }
    else {
        removeUnneccessaryFilters(false, false,false,true, false);
    }

    // Find parent
    let parent = document.getElementById("teamSizeFilters");

    // Determine min values of teamsize
    let minTeamSize = 2;
    if (boardGame) {
        if (game.minTeamSize != null) {
            minTeamSize = game.minTeamSize;
        }
    }

    // Determine max values of teamsize
    let globalMaxTeamSize = game.maxTeamSize;
    let localMaxTeamSize;
    if (game.gamemodes != null) {
        game.gamemodes.forEach(gamemode => {
            if (gamemode.id === selectedGamemode) {
                if (gamemode.maxTeamSize != null) {
                    localMaxTeamSize = gamemode.maxTeamSize;
                }
            }
        });
    }

    // Select the team size to use
    let maxTeamSize = localMaxTeamSize == null ? globalMaxTeamSize : localMaxTeamSize;

    // Create HTML with slider and append to parent
    let html = `
        <input type="range" min="${minTeamSize}" max="${maxTeamSize}" value="${maxTeamSize}" class="teamSizeSlider teamSizeFilter" id="teamSizeSlider"/>
        <input type="number" name="Team size" min="${minTeamSize}" max="${maxTeamSize}" value="${maxTeamSize}" class="teamSizeFilter" id="teamSizeSliderValue"/>
    `;

    parent.innerHTML = html;

    // OnValueChanged functions
    let slider = document.getElementById("teamSizeSlider");
    let textBox = document.getElementById("teamSizeSliderValue");

    slider.addEventListener("input", function() {
        selectedTeamSize = slider.valueAsNumber;
        textBox.value = selectedTeamSize;
    }, false);

    textBox.addEventListener("input", function() {
        selectedTeamSize = textBox.valueAsNumber;
        slider.value = selectedTeamSize;
    }, false);

    // Set default team size value to selectedTeamSize
    selectedTeamSize = maxTeamSize;

    createSubmitButton();
}

function createSubGamemodeFilter(game, subGamemodes) {
    // Remove previously created subgamemode and lower filters
    removeUnneccessaryFilters(false, true, true, true, true);

    // Find parent
    let parent = document.getElementById("subGamemodeFilters");

    // Create HTML with buttons
    let html = "";
    subGamemodes.forEach(subGamemode => {
        html += `
            <input class="filterButton subGamemodeFilter" id=\"${game.id + gamemode.id + subGamemode.id+ "Button"}\" type=\"button\" value=\"${subGamemode.name}"/>
        `
    });

    // Append new HTML to parent
    parent.innerHTML = html;

    // Create eventlisteners
    subGamemodes.forEach(subGamemode => {
        let button = document.getElementById(game.id + gamemode.id + subGamemode.id+ "Button")
        if ((game.ranks.length > 0) || (game.numericalRanks === true)) {
            button.addEventListener("click", function() {
                selectedSubGamemode = subGamemode.id;
                buttonClicked(button, "subGamemodeFilter");
                createRankFilter(game);
            }, false)
        }
        else {
            button.addEventListener("click", function() {
                selectedSubGamemode = subGamemode.id;
                buttonClicked(button, "subGamemodeFilter");
                createTeamSizeFilter(game);
            }, false)
        }
    })
}

function createBoardGameList(boardGames) {
    // Remove all videogame filters
    removeUnneccessaryFilters(true, true, true, true, true);

    // Find parent
    let parent = document.getElementById("boardGameFilters");

    // Create the new HTML
    let html = "";
    boardGames.forEach(boardGame => {
        html += `
            <input class="boardGameFilter filterButton" id="${boardGame.id + "Button"}" type="button" value="${boardGame.name}"/>
            `
    });

    // Append the html
    parent.innerHTML = html;

    // Create eventlisteners
    boardGames.forEach(boardGame => {
        let button = document.getElementById(boardGame.id + "Button");
        button.addEventListener("click", function() {
            selectedBoardGame = boardGame.id;
            buttonClicked(button, "boardGameFilter");
            createTeamSizeFilter(boardGame);
        })
    })
}

function createSubmitButton() {
    // Find parent
    let parent = document.getElementById("submitFilters");

    // Create the html for the button
    let html = `
            <input class="submitFiltersButton filterButton" id="submitFilters" type="button" value="Submit"/>
            <input class="resetFiltersButton filterButton" id="resetFilters" type="button" value="Reset filters"/>
    `;

    parent.innerHTML = html;

    // Add eventlisteners
    let submitButton = document.getElementById("submitFilters");
    submitButton.addEventListener("click", function() {
        submitForm();
    });

    let resetButton = document.getElementById("resetFilters");
    resetButton.addEventListener("click", function() {
        removeUnneccessaryFilters(true, true, true, true, true);
        unclickOtherButtons("gameFilter")
        // TODO: Remove game filter as well
    })
}

function submitForm() {
    // Game and teamsize have to be filled in every case
    if (selectedGame != null && selectedTeamSize != null && selectedTeamSize !== 0) {
        let teamRequest;
        if (selectedGame === "boardGame") {
            teamRequest = {
                game: selectedGame,
                boardGame: selectedBoardGame,
                teamsize: selectedTeamSize
            }
        }
        else {
            teamRequest = {
                game: selectedGame,
                gamemode: selectedGamemode,
                subGamemode: selectedSubGamemode,
                ranks: selectedRanks,
                teamsize: selectedTeamSize
            }
        }
        filename = "data/listings.json";
        writeToFile(filename, teamRequest);
    }
}

function writeToFile(filename, data) {

}

// Function to add or remove selected ranks from global list
function addOrRemoveRank(rank, button) {
    button.classList.toggle("selectedButton");
    selectedRanks.delete(rank);
}

function buttonClicked(button, classname) {
    unclickOtherButtons(classname);
    button.classList.toggle("selectedButton");
}

function unclickOtherButtons(classname) {
    let otherButtonsAtSameHierarchy = document.getElementsByClassName(classname);
    for (let i = 0; i < otherButtonsAtSameHierarchy.length; i++)
    {
        otherButtonsAtSameHierarchy[i].classList.remove("selectedButton")
    }
}

function removeUnneccessaryFilters(gamemode, subGamemode, rank, teamSize, boardGame) {
    if (gamemode) {
        removeFilters("gamemodeFilter");
        selectedGamemode = null;
    }
    if (subGamemode) {
        removeFilters("subGamemodeFilter");
        selectedSubGamemode = null;
    }
    if (rank) {
        removeFilters("rankFilter");
        selectedRanks.clear();
    }
    if (teamSize) {
        removeFilters("teamSizeFilter");
        removeFilters("submitFiltersButton");
        removeFilters("resetFiltersButton");
        selectedTeamSize = null;
    }
    if (boardGame) {
        removeFilters("boardGameFilter");
        selectedBoardGame = null;
    }
}

function removeFilters(classname) {
    let filters = document.getElementsByClassName(classname);
    for (let i = filters.length - 1; i >= 0; i--) {
        filters[i].parentElement.removeChild(filters[i]);
    }
}

// $(function() {
//     $(".user-menu").click(function(){
//         $("#dimmer").fadeToggle();
//         $(".sidebar-user").animate({width:'toggle'},350);
//     });
// });

function readGameConfigFile(file)
{
    // Fetches the gameConfig file data and creates form
    fetch(file)
        .then(response => response.json())
        .then(data => {
            createGameButtons(data);
        })
}

function getBaseUrl() {
    url = window.location.href;
    let to = url.lastIndexOf('/');
    to = to === -1 ? url.length : to + 1;
    url = url.substring(0, to);
    return url;
}
