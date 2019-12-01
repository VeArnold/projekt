$(function() {
    let selectedGame;
    let selectedBoardGame;
    let selectedGamemode;
    let selectedSubGamemode;
    let selectedRanks = new Set();
    let selectedTeamSize;
    let gameConfigData;

    window.addEventListener('load', function () {
        readGameConfig();
        readGroupsInfo();
        let addNewGroupButton = document.getElementById("add-new-group-request-button");
        addNewGroupButton.addEventListener("click", function () {
            addNewGroup();
        }, false);
        let addGroupModalCloseButton = document.getElementById("add-new-group-modal-close");
        addGroupModalCloseButton.addEventListener("click", function () {
            removeUnneccessaryFilters(true, true, true, true, true);
            unclickOtherButtons("game-select");
            addNewGroup();
        }, false);
    });

    // Toggles the add group modal
    function addNewGroup() {
        document.getElementById("add-new-group-request-modal").classList.toggle("visible");
    }

    function readGameConfig() {
        let url = getBaseUrl() + "data/gameConfig.json";
        readGameConfigFile(url);
    }

    function createGroupsList() {
        // Fetch groupsList data from localstorage
        let groupsList = JSON.parse(localStorage.getItem("groupsList"));

        // Find parent
        let parent = document.getElementById("groupsListContainer");

        let html = "";
        groupsList.groups.forEach(group => {
            let gameId = group.game;
            let gamemodeId = group.gamemode == null ? null : group.gamemode;
            let subGamemodeId = group.subGamemode == null ? null : group.subGamemode;
            let ranksList = (group.ranks == null || group.ranks.length > 0) ? null : group.ranks;
            let boardGameId = group.boardGame == null ? null : group.boardGame;
            let teamSize = group.teamsize == null ? null : group.teamsize;
            let userName = group.user == null ? null : group.user;
            let registeredUsersList = group.registeredUsers == null ? [] : group.registeredUsers;

            let gameName = "";
            let gameData = "";
            if (gameId === "boardGame") {
                if (boardGameId && teamSize && userName) {
                    gameConfigData.boardGames.forEach(boardGame => {
                        if (boardGame.id === boardGameId) {
                            gameName = boardGame.name;
                            gameData = `Mängijaid: ${registeredUsersList.length + 1}/${teamSize} | ${userName}`;
                        }
                    })
                }
            } else {
                gameConfigData.videoGames.forEach(videoGame => {
                    if (videoGame.id === gameId) {
                        gameName = videoGame.name;
                        let gamemodeName = "";
                        let subGamemodeName = "";
                        let ranksListText = "";
                        if (gamemodeId) {
                            videoGame.gamemodes.forEach(gamemode => {
                                if (gamemode.id === gamemodeId) {
                                    gamemodeName = gamemode.name;
                                    if (subGamemodeId) {
                                        gamemode.subGamemodes.forEach(subGamemode => {
                                            if (subGamemode.id === subGamemodeId) {
                                                subGamemodeName = subGamemode.name;
                                            }
                                        })
                                    }
                                }
                            })
                        }
                        if (ranksList && ranksList.length > 0) {
                            ranksListText = ranksList.join(", ");
                        }
                        if (gamemodeName !== "") {
                            gameData += gamemodeName + " | ";
                            if (subGamemodeName !== "") {
                                gameData += subGamemodeName + " | ";
                            }
                        }
                        if (ranksListText !== "") {
                            gameData += ranksListText + " | ";
                        }
                        gameData += `Mängijaid: ${registeredUsersList.length + 1}/${teamSize} | ${userName}`;
                    }
                })
            }
            html += `
                <div class="groupRequestItem">
                    <div class="groupRequestItemGame">${gameName}</div>
                    <div class="groupRequestItemData">
                        ${gameData}
                    </div>
                    <input class="filter-button" type="button" value="Join team"/>
                </div>
            `

        });

        parent.innerHTML = html;
    }

    function createListFilters() {
        // Find parent
        let parent = document.getElementById("groupsFiltersContainer");


    }

    
    function createGameButtons(data) {
        // Find the parent for the game buttons
        parent = document.getElementById("game-buttons-container");

        // Generate the HTML for the buttons
        let html = "";
        data.videoGames.forEach(game => {
            html += `
                <div class="game-button game-select" id=\"${game.id + "Button"}\">
                </div>
                `;
        });
        html += `
            <div class="game-button game-select" id=\"board-games-button\"></div>
                `;

        // Populate the parent with the new HTML
        parent.innerHTML = html;

        // Create eventlisteners
        data.videoGames.forEach(game => {
            let button = document.getElementById(game.id + "Button");
            // Gamemodes exist for this game
            if (game.gamemodes.length > 0) {
                button.addEventListener("click", function () {
                    selectedGame = game.id;
                    imageButtonClicked(button, "game-select");
                    createGameModeSelectors(game);
                }, false);
            }
            // Gamemodes don't exist, check if ranks exist
            else {
                // Ranks do exist, create rank filters next
                if ((game.ranks != null) && (game.ranks.length > 0) || (game.numericalRanks === true)) {
                    button.addEventListener("click", function () {
                        // Remove previous filters that might be on the page (since we start from lower than usual hierarchy).
                        removeUnneccessaryFilters(true, true, true, true, true);

                        selectedGame = game.id;
                        imageButtonClicked(button, "game-select");
                        createRankFilter(game);
                    }, false);
                } else {
                    // Ranks don't exist, create team size filter instead
                    button.addEventListener("click", function () {
                        // Remove previous filters that might be on the page (since we start from lower than usual hierarchy).
                        removeUnneccessaryFilters(true, true, true, true, true);

                        selectedGame = game.id;
                        imageButtonClicked(button, "game-select");
                        createTeamSizeFilter(game);
                    }, false);
                }
            }
        });

        // Add listener also for board games
        let button = document.getElementById("board-games-button");
        button.addEventListener("click", function () {
            selectedGame = "boardGame";
            imageButtonClicked(button, "game-select");
            createBoardGameList(data.boardGames);
        }, false);
    }

    function createGameModeSelectors(game) {
        // Remove previously created gamemode and lower filters
        removeUnneccessaryFilters(gamemode = true, true, true, true, true);

        // Find parent
        var parent = document.getElementById("gamemodes-container");

        // Create HTML with buttons
        html = "";
        game.gamemodes.forEach(gamemode => {
            html += `
                <input class="filter-button gamemode-select" id=\"add-group-${game.id + "-" + gamemode.id + "-button"}\" type=\"button\" value=\"${gamemode.name}"/>
            `
        });

        // Append new HTML to parent
        parent.innerHTML = html;
        // Create eventlisteners
        game.gamemodes.forEach(gamemode => {
            console.log(gamemode.name);
            let button = document.getElementById("add-group-" + game.id + "-" + gamemode.id + "-button");
            // Subgamemodes don't exist
            if (gamemode.subGamemodes == null || gamemode.subGamemodes.length === 0) {
                // Ranks exist
                if ((game.ranks.length > 0) || (game.numericalRanks === true)) {
                    button.addEventListener("click", function () {
                        console.log("Listener clicked");
                        selectedGamemode = gamemode.id;
                        console.log(selectedGamemode);
                        buttonClicked(button, "gamemode-select");
                        createRankFilter(game);
                    }, false)
                } else {
                    // Ranks don't exist
                    button.addEventListener("click", function () {
                        console.log("Listener clicked");
                        selectedGamemode = gamemode.id;
                        buttonClicked(button, "gamemode-select");
                        createTeamSizeFilter(game);
                    }, false)
                }
            }
            // Subgamemodes exist as well
            else {
                button.addEventListener("click", function () {
                    selectedGamemode = gamemode.id;
                    buttonClicked(button, "gamemode-select");
                    createSubGamemodeFilter(game, gamemode.subGamemodes);
                }, false)
            }
        })
    }

    function createRankFilter(game) {
        console.log("Now we're here");
        // Remove previously created rank and lower filters
        removeUnneccessaryFilters(gamemode = false, subGamemode = false, rank = true, teamsize = true, true);

        // Find parent
        let parent = document.getElementById("ranks-container");

        // Create HTML with buttons
        let html = "";
        let i = 0;

        let rowsPerColumn = game.ranksPerColumn != null && game.ranksPerColumn !== 0 ? game.ranksPerColumn : game.ranks.length;
        game.ranks.forEach(rank => {
            if (i % rowsPerColumn === 0) {
                html += `<div class="rank-col">`
            }
            html += `
                <div class="rank-select check-box-button" id=\"${"add-group-rank" + game.id + i.toString() + "-button"}\">${rank}</div>
            `;
            if (i % rowsPerColumn === rowsPerColumn - 1) {
                html += `</div>`
            }
            i++;
        });
        parent.innerHTML = html;

        // Add listeners for buttons to toggle state
        i = 0;
        game.ranks.forEach(rank => {
            let rankButton = document.getElementById("add-group-rank" + game.id + i.toString() + "-button");
            rankButton.addEventListener("click", function () {
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
        } else {
            removeUnneccessaryFilters(false, false, false, true, false);
        }

        // Find parent
        let parent = document.getElementById("team-size-selectors-container");

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
            <input type="range" min="${minTeamSize}" max="${maxTeamSize}" value="${maxTeamSize}" class="team-size-slider team-size-select" id="team-size-slider"/>
            <input type="number" name="Team size" min="${minTeamSize}" max="${maxTeamSize}" value="${maxTeamSize}" class="team-size-box team-size-select" id="team-size-slider-value"/>
        `;

        parent.innerHTML = html;

        // OnValueChanged functions
        let slider = document.getElementById("team-size-slider");
        let textBox = document.getElementById("team-size-slider-value");

        slider.addEventListener("input", function () {
            selectedTeamSize = slider.valueAsNumber;
            textBox.value = selectedTeamSize;
        }, false);

        textBox.addEventListener("input", function () {
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
        let parent = document.getElementById("sub-gamemodes-container");

        // Create HTML with buttons
        let html = "";
        subGamemodes.forEach(subGamemode => {
            html += `
                <input class="filter-button sub-gamemode-select" id=\"${"add-group-game.id" + gamemode.id + subGamemode.id + "-button"}\" type=\"button\" value=\"${subGamemode.name}"/>
            `
        });

        // Append new HTML to parent
        parent.innerHTML = html;

        // Create eventlisteners
        subGamemodes.forEach(subGamemode => {
            let button = document.getElementById("add-group-game.id" + gamemode.id + subGamemode.id + "-button");
            if ((game.ranks.length > 0) || (game.numericalRanks === true)) {
                button.addEventListener("click", function () {
                    selectedSubGamemode = subGamemode.id;
                    buttonClicked(button, "sub-gamemode-select");
                    createRankFilter(game);
                }, false)
            } else {
                button.addEventListener("click", function () {
                    selectedSubGamemode = subGamemode.id;
                    buttonClicked(button, "sub-gamemode-select");
                    createTeamSizeFilter(game);
                }, false)
            }
        })
    }

    function createBoardGameList(boardGames) {
        // Remove all videogame filters
        removeUnneccessaryFilters(true, true, true, true, true);

        // Find parent
        let parent = document.getElementById("board-game-container");

        // Create the new HTML
        let html = "";
        boardGames.forEach(boardGame => {
            html += `
                <div class="game-button board-game-select" id="${boardGame.id + "Button"}"></div>
                `
        });

        // Append the html
        parent.innerHTML = html;

        // Create eventlisteners
        boardGames.forEach(boardGame => {
            let button = document.getElementById(boardGame.id + "Button");
            button.addEventListener("click", function () {
                selectedBoardGame = boardGame.id;
                imageButtonClicked(button, "board-game-select");
                createTeamSizeFilter(boardGame);
            })
        })
    }

    function createSubmitButton() {
        // Find parent
        let parent = document.getElementById("footer-buttons-container");

        // Create the html for the button
        let html = `
                <input class="submit-group-button filter-button" id="submit-game-request" type="button" value="Submit"/>
                <input class="reset-selections-button filter-button" id="reset-add-game-selections" type="button" value="Reset filters"/>
        `;

        parent.innerHTML = html;

        // Add eventlisteners
        let submitButton = document.getElementById("submit-game-request");
        submitButton.addEventListener("click", function () {
            submitForm();
        });

        let resetButton = document.getElementById("reset-add-game-selections");
        resetButton.addEventListener("click", function () {
            removeUnneccessaryFilters(true, true, true, true, true);
            unclickOtherButtons("game-select")
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
                    teamsize: selectedTeamSize,
                    user: "Kasutaja",
                    registeredUsers: []
                }
            } else {
                teamRequest = {
                    game: selectedGame,
                    gamemode: selectedGamemode,
                    subGamemode: selectedSubGamemode,
                    ranks: Array.from(selectedRanks),
                    teamsize: selectedTeamSize,
                    user: "Kasutaja",
                    registeredUsers: []
                }
            }
            // TODO: Write to file
            // While PHP isn't working, let's just use localStorage to store this data
            let groupsList = JSON.parse(localStorage.getItem("groupsList"));
            groupsList.groups.push(teamRequest);
            localStorage.setItem("groupsList", JSON.stringify(groupsList));
            removeUnneccessaryFilters(true, true, true, true, true);
            unclickOtherButtons("game-select");
            addNewGroup();
        }
    }

    // TODO: Do
    function writeToFile(filename, data) {
        let data_serialized = JSON.stringify(data);
        let existingData = JSON.parse(localStorage.getItem("groupsList"));
    }

    // Function to add or remove selected ranks from global list
    function addOrRemoveRank(rank, button) {
        button.classList.toggle("selected-filter-button");
        if (selectedRanks.has(rank)) {
            selectedRanks.delete(rank);
        } else {
            selectedRanks.add(rank);
        }
    }

    function imageButtonClicked(button, classname) {
        unclickOtherButtons(classname);
        button.classList.toggle("selected-button");
    }

    function buttonClicked(button, classname) {
        unclickOtherButtons(classname);
        button.classList.toggle("selected-filter-button");
    }

    function unclickOtherButtons(classname) {
        let otherButtonsAtSameHierarchy = document.getElementsByClassName(classname);
        for (let i = 0; i < otherButtonsAtSameHierarchy.length; i++) {
            otherButtonsAtSameHierarchy[i].classList.remove("selected-button")
        }
    }

    function removeUnneccessaryFilters(gamemode, subGamemode, rank, teamSize, boardGame) {
        if (gamemode) {
            removeFilters("gamemode-select");
            selectedGamemode = null;
        }
        if (subGamemode) {
            removeFilters("sub-gamemode-select");
            selectedSubGamemode = null;
        }
        if (rank) {
            removeFilters("rank-select");
            selectedRanks.clear();
        }
        if (teamSize) {
            removeFilters("team-size-select");
            removeFilters("submit-group-button");
            removeFilters("reset-selections-button");
            selectedTeamSize = null;
        }
        if (boardGame) {
            removeFilters("board-game-select");
            selectedBoardGame = null;
        }
    }

    function removeFilters(classname) {
        let filters = document.getElementsByClassName(classname);
        for (let i = filters.length - 1; i >= 0; i--) {
            filters[i].parentElement.removeChild(filters[i]);
        }
    }

    function readGameConfigFile(file) {
        // Fetches the gameConfig file data and creates form
        fetch(file)
            .then(response => response.json())
            .then(data => {
                gameConfigData = data;
                createGameButtons(data);
            })
    }

    function readGroupsInfo() {
        let url = getBaseUrl() + "data/groupsList.json";
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (localStorage.getItem("groupsList") == null) {
                    localStorage.setItem("groupsList", JSON.stringify(data));
                }
                createGroupsList();
            });
    }

    function getBaseUrl() {
        let url = window.location.href;
        let to = url.lastIndexOf('/');
        to = to === -1 ? url.length : to + 1;
        url = url.substring(0, to);
        return url;
    }
});
