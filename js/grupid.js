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

        let deleteGroupFilters = document.getElementById("groups-filters-reset-button");
        deleteGroupFilters.addEventListener("click", function () {
            removeUnneccessaryFilters(true, true, true, true, true, true);
            unclickOtherButtons("game-select");
            filterGroupsList(null, null, null, null, null);
        }, false);
    });

    // Toggles the add group modal
    function addNewGroup() {
        document.getElementById("add-new-group-request-modal").classList.toggle("visible");
        $("#dimmer").fadeToggle();
    }

    function readGameConfig() {
        let url = getBaseUrl() + "data/gameConfig.json";
        readGameConfigFile(url);
    }

    function createGroupsList() {
        // Fetch groupsList data from localstorage
        let groupsList = JSON.parse(localStorage.getItem("groupsList"));

        // Find parent
        let parent = document.getElementById("groups-list-container");

        let html = "";
        groupsList.groups.forEach(group => {
            let gameId = group.game;
            let gamemodeId = group.gamemode == null ? null : group.gamemode;
            let subGamemodeId = group.subGamemode == null ? null : group.subGamemode;
            let ranksList = (group.ranks == null || group.ranks.length === 0) ? null : group.ranks;
            let boardGameId = group.boardGame == null ? null : group.boardGame;
            let teamSize = group.teamsize == null ? null : group.teamsize;
            let userName = group.user == null ? null : group.user;
            let registeredUsersList = group.registeredUsers == null ? [] : group.registeredUsers;

            let gameName = "";
            let gameData = "";
            let gameInfo = "";
            let ranksListText = "";
            let imgUrl = "";
            if (gameId === "boardGame") {
                if (boardGameId && teamSize && userName) {
                    gameConfigData.boardGames.forEach(boardGame => {
                        if (boardGame.id === boardGameId) {
                            imgUrl = boardGame.selIconPath;
                            gameInfo = ` data-game="boardGame" data-board-game="${boardGame.id}"`;
                            gameName = boardGame.name;
                            gameData = `Mängijaid: ${registeredUsersList.length + 1}/${teamSize} | ${userName}`;
                        }
                    })
                }
            } else {
                gameConfigData.videoGames.forEach(videoGame => {
                    if (videoGame.id === gameId) {
                        imgUrl = videoGame.selIconPath;
                        gameInfo = ` data-game="${videoGame.id}" data-board-game=${null}`;
                        gameName = videoGame.name;
                        let gamemodeName = "";
                        let subGamemodeName = "";
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
            if (ranksListText === "") {
                ranksListText = null;
            }
            html += `
                <div class="group-request-item">
                    <div class="group-request-item-game"${gameInfo}>
                        <img class="groups-list-icon" src="${imgUrl}" alt="${gameName}"/>
                    </div>
                    <div class="group-request-item-data" data-gamemode="${gamemodeId}" data-subGamemode="${subGamemodeId}" data-ranks="${ranksListText}">
                        ${gameData}
                    </div>
                    <div class="filter-button left-aligned">Liitu</div>
                </div>
            `;

        });

        parent.innerHTML = html;
    }

    function createListFilters(data) {
        // Find parent
        let parent = document.getElementById("groups-filters-buttons-container");

        let html = getGameButtonsHTML(data, "groups-filters-", "groups-");

        parent.innerHTML = html;

        // Create eventlisteners
        data.videoGames.forEach(game => {
            let button = document.getElementById("groups-filters-" + game.id + "-button");
            // Gamemodes exist for this game
            if (game.gamemodes.length > 0) {
                button.addEventListener("click", function () {
                    imageButtonClicked(button, "groups-game-select");
                    createGroupsListFiltersGamemodeSelectors(game);
                    filterGroupsList(game.id, null, null, null, null);
                }, false);
            }
            // Gamemodes don't exist, check if ranks exist
            else {
                // Ranks do exist, create rank filters next
                if ((game.ranks != null) && (game.ranks.length > 0) || (game.numericalRanks === true)) {
                    button.addEventListener("click", function () {
                        // Remove previous filters that might be on the page (since we start from lower than usual hierarchy).
                        removeUnneccessaryFilters(true, true, true, true, true, true);
                        imageButtonClicked(button, "groups-game-select");
                        createAddGroupRankSelectors(game);
                        filterGroupsList(game.id, null, null, null, null);
                    }, false);
                } else {
                    // Ranks don't exist, filter the list right away
                    button.addEventListener("click", function () {
                        // Remove previous filters that might be on the page (since we start from lower than usual hierarchy).
                        removeUnneccessaryFilters(true, true, true, true, true, true);
                        imageButtonClicked(button, "groups-game-select");
                        filterGroupsList(game.id, null, null, null, null);
                    }, false);
                }
            }
        });

        // Add listener also for board games
        let button = document.getElementById("groups-filters-board-games-button");
        button.addEventListener("click", function () {
            imageButtonClicked(button, "groups-game-select");
            createGroupsListBoardGameList(data.boardGames);
            filterGroupsList("boardGame", null, null, null, null);
        }, false);
    }
    
    function createAddGroupGameButtons(data) {
        // Find the parent for the game buttons
        parent = document.getElementById("game-buttons-container");

        // Generate the HTML for the buttons
        let html = getGameButtonsHTML(data, "add-group-");

        // Populate the parent with the new HTML
        parent.innerHTML = html;

        // Create eventlisteners
        data.videoGames.forEach(game => {
            let button = document.getElementById("add-group-" + game.id + "-button");
            // Gamemodes exist for this game
            if (game.gamemodes.length > 0) {
                button.addEventListener("click", function () {
                    selectedGame = game.id;
                    imageButtonClicked(button, "game-select");
                    createAddGroupGamemodeSelectors(game);
                }, false);
            }
            // Gamemodes don't exist, check if ranks exist
            else {
                // Ranks do exist, create rank filters next
                if ((game.ranks != null) && (game.ranks.length > 0) || (game.numericalRanks === true)) {
                    button.addEventListener("click", function () {
                        // Remove previous filters that might be on the page (since we start from lower than usual hierarchy).
                        removeUnneccessaryFilters(true, true, true, true, true, false);

                        selectedGame = game.id;
                        imageButtonClicked(button, "game-select");
                        createAddGroupRankSelectors(game);
                    }, false);
                } else {
                    // Ranks don't exist, create team size filter instead
                    button.addEventListener("click", function () {
                        // Remove previous filters that might be on the page (since we start from lower than usual hierarchy).
                        removeUnneccessaryFilters(true, true, true, true, true, false);

                        selectedGame = game.id;
                        imageButtonClicked(button, "game-select");
                        createAddGroupTeamSizeSelectors(game);
                    }, false);
                }
            }
        });

        // Add listener also for board games
        let button = document.getElementById("add-group-board-games-button");
        button.addEventListener("click", function () {
            selectedGame = "boardGame";
            imageButtonClicked(button, "game-select");
            createAddGroupBoardGameList(data.boardGames);
        }, false);
    }

    function getGameButtonsHTML(data, idStart, groups) {
        if (groups == null) {
            groups = "";
        }
        let html = "";
        data.videoGames.forEach(game => {
            html += `
                    <div class="game-button ${groups}game-select" id=\"${idStart + game.id + "-button"}\">
                    </div>
                    `;
        });
        html += `
                <div class="game-button ${groups}game-select" id=\"${idStart}board-games-button\"></div>
                    `;
        return html;
    }

    function createGroupsListFiltersGamemodeSelectors(game) {
        // Remove previously created gamemode and lower filters
        removeUnneccessaryFilters(gamemode = true, true, true, true, true, true);

        // Find parent
        var parent = document.getElementById("groups-filters-gamemode-container");

        let html = getGamemodeHTML(game, "groups-filters-", "groups-");
        // Append new HTML to parent
        parent.innerHTML = html;

        // Add listeners
        game.gamemodes.forEach(gamemode => {
            let button = document.getElementById("groups-filters-" + game.id + "-" + gamemode.id + "-button");
            // Subgamemodes don't exist
            if (gamemode.subGamemodes == null || gamemode.subGamemodes.length === 0) {
                // Ranks exist
                if ((game.ranks.length > 0) || (game.numericalRanks === true)) {
                    button.addEventListener("click", function () {
                        buttonClicked(button, "groups-gamemode-select");
                        createGroupsFiltersRankSelectors(game, gamemode, null);
                        filterGroupsList(game.id, gamemode.id, null, null, null);
                    }, false)
                }
                // Ranks don't exist
                else {
                    button.addEventListener("click", function () {
                        buttonClicked(button, "groups-gamemode-select");
                        filterGroupsList(game.id, gamemode.id, null, null, null);
                    }, false)
                }
            }
            // Subgamemodes exist as well
            else {
                button.addEventListener("click", function () {
                    buttonClicked(button, "groups-gamemode-select");
                    createGroupsFiltersSubGamemodeButtons(game, gamemode, gamemode.subGamemodes);
                    filterGroupsList(game.id, gamemode.id, null, null, null);
                }, false)
            }
        })
    }

    function createAddGroupGamemodeSelectors(game) {
        // Remove previously created gamemode and lower filters
        removeUnneccessaryFilters(gamemode = true, true, true, true, true, false);

        // Find parent
        let parent = document.getElementById("gamemodes-container");

        // Create HTML with buttons
        let html = getGamemodeHTML(game, "add-group-");

        // Append new HTML to parent
        parent.innerHTML = html;
        // Create eventlisteners
        game.gamemodes.forEach(gamemode => {
            let button = document.getElementById("add-group-" + game.id + "-" + gamemode.id + "-button");
            // Subgamemodes don't exist
            if (gamemode.subGamemodes == null || gamemode.subGamemodes.length === 0) {
                // Ranks exist
                if ((game.ranks.length > 0) || (game.numericalRanks === true)) {
                    button.addEventListener("click", function () {
                        selectedGamemode = gamemode.id;
                        buttonClicked(button, "gamemode-select");
                        createAddGroupRankSelectors(game);
                    }, false)
                } else {
                    // Ranks don't exist
                    button.addEventListener("click", function () {
                        selectedGamemode = gamemode.id;
                        buttonClicked(button, "gamemode-select");
                        createAddGroupTeamSizeSelectors(game);
                    }, false)
                }
            }
            // Subgamemodes exist as well
            else {
                button.addEventListener("click", function () {
                    selectedGamemode = gamemode.id;
                    buttonClicked(button, "gamemode-select");
                    createAddGroupSubGamemodeButtons(game, gamemode, gamemode.subGamemodes);
                }, false)
            }
        })
    }

    function getGamemodeHTML(game, idStart, groups) {
        if (groups == null) {
            groups = "";
        }
        let html = "";
        game.gamemodes.forEach(gamemode => {
            html += `
                <div class="filter-button ${groups}gamemode-select" id=\"${idStart + game.id + "-" + gamemode.id + "-button"}\" >${gamemode.name}</div>
            `
        });
        return html;
    }

    function createGroupsFiltersRankSelectors(game, gamemode, subGamemode) {
        // Remove previously created rank filters
        removeUnneccessaryFilters( false, false, true, false, true, false);

        // Find parent
        let parent = document.getElementById("groups-filters-ranks-container");

        // Create the HTML
        let html = createRankSelectorHTML(game, "groups-filters-", "groups-");

        parent.innerHTML = html;

        // Add listeners for buttons to toggle state
        let i = 0;
        game.ranks.forEach(rank => {
            let rankButton = document.getElementById("groups-filters-rank-" + game.id + i.toString() + "-button");
            rankButton.addEventListener("click", function () {
                let gamemodeId = null;
                let subGamemodeId = null;
                if (gamemode) {
                    gamemodeId = gamemode.id;
                }
                if (subGamemode) {
                    subGamemodeId = subGamemode.id;
                }

                selectRank(rank, rankButton, game.id, gamemodeId, subGamemodeId);
            });
            i++;
        });
    }

    function createAddGroupRankSelectors(game) {
        // Remove previously created rank and lower filters
        removeUnneccessaryFilters(gamemode = false, subGamemode = false, rank = true, teamsize = true, true, false);

        // Find parent
        let parent = document.getElementById("ranks-container");

        // Create HTML with buttons
        let html = createRankSelectorHTML(game, "add-group-");

        parent.innerHTML = html;

        // Add listeners for buttons to toggle state
        let i = 0;
        game.ranks.forEach(rank => {
            let rankButton = document.getElementById("add-group-rank-" + game.id + i.toString() + "-button");
            rankButton.addEventListener("click", function () {
                addOrRemoveRank(rank, rankButton);
            });
            i++;
        });

        // Create teamsize filter along with rank filter
        createAddGroupTeamSizeSelectors(game);
    }

    function createRankSelectorHTML(game, idStart, groups) {
        if (groups == null) {
            groups = "";
        }
        let html = "";
        let i = 0;

        let rowsPerColumn = game.ranksPerColumn != null && game.ranksPerColumn !== 0 ? game.ranksPerColumn : game.ranks.length;
        game.ranks.forEach(rank => {
            if (i % rowsPerColumn === 0) {
                html += `<div class="rank-col">`
            }
            html += `
                <div class="${groups}rank-select check-box-button" id=\"${idStart + "rank-" + game.id + i.toString() + "-button"}\">${rank}</div>
            `;
            if (i % rowsPerColumn === rowsPerColumn - 1) {
                html += `</div>`
            }
            i++;
        });
        return html;
    }

    function createAddGroupTeamSizeSelectors(game, boardGame) {
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

    function createGroupsFiltersSubGamemodeButtons(game, gamemode, subGamemodes) {
        // Remove previously created subgamemode and lower filters
        removeUnneccessaryFilters(false, true, true, true, true);

        // Find parent
        let parent = document.getElementById("groups-filters-sub-gamemode-container");

        // Crate HTML
        let html = createSubGamemodesHTML(game, gamemode, subGamemodes, "groups-filters-", "groups-");

        parent.innerHTML = html;

        // Create eventlisteners
        subGamemodes.forEach(subGamemode => {
            let button = document.getElementById("groups-filters-" + game.id + gamemode.id + subGamemode.id + "-button");
            if ((game.ranks.length > 0) || (game.numericalRanks === true)) {
                button.addEventListener("click", function () {
                    buttonClicked(button, "groups-sub-gamemode-select");
                    createGroupsFiltersRankSelectors(game, gamemode, subGamemode);
                    filterGroupsList(game.id, gamemode.id, subGamemode.id, null, null);
                }, false)
            }
        });
    }

    function createAddGroupSubGamemodeButtons(game, gamemode, subGamemodes) {
        // Remove previously created subgamemode and lower filters
        removeUnneccessaryFilters(false, true, true, true, true);

        // Find parent
        let parent = document.getElementById("sub-gamemodes-container");

        // Create HTML with buttons
        let html = createSubGamemodesHTML(game, gamemode, subGamemodes, "add-group-");

        // Append new HTML to parent
        parent.innerHTML = html;

        // Create eventlisteners
        subGamemodes.forEach(subGamemode => {
            let button = document.getElementById("add-group-" + game.id + gamemode.id + subGamemode.id + "-button");
            if ((game.ranks.length > 0) || (game.numericalRanks === true)) {
                button.addEventListener("click", function () {
                    selectedSubGamemode = subGamemode.id;
                    buttonClicked(button, "sub-gamemode-select");
                    createAddGroupRankSelectors(game);
                }, false)
            } else {
                button.addEventListener("click", function () {
                    selectedSubGamemode = subGamemode.id;
                    buttonClicked(button, "sub-gamemode-select");
                    createAddGroupTeamSizeSelectors(game);
                }, false)
            }
        });
    }

    function createSubGamemodesHTML(game, gamemode, subGamemodes, idStart, groups) {
        if (groups == null) {
            groups = "";
        }
        let html = "";
        subGamemodes.forEach(subGamemode => {
            html += `
                <div class="filter-button ${groups}sub-gamemode-select" id=\"${idStart + game.id + gamemode.id + subGamemode.id + "-button"}\">${subGamemode.name}</div>
            `
        });

        return html;
    }

    function createGroupsListBoardGameList(boardGames) {
        // Remove all videogame filters
        removeUnneccessaryFilters(true, true, true, true, true, true);

        // Find parent
        let parent = document.getElementById("groups-filters-board-game-container");

        // Create the new HTML
        let html = createBoardGameButtonsHTML(boardGames, "groups-filters-", "groups-");

        // Append the html
        parent.innerHTML = html;

        // Create eventlisteners
        boardGames.forEach(boardGame => {
            let button = document.getElementById("groups-filters-" + boardGame.id + "-button");
            button.addEventListener("click", function () {
                imageButtonClicked(button, "groups-board-game-select");
                filterGroupsList(null, null, null, null, boardGame.id);
            })
        })
    }

    function createAddGroupBoardGameList(boardGames) {
        // Remove all videogame filters
        removeUnneccessaryFilters(true, true, true, true, true);

        // Find parent
        let parent = document.getElementById("board-game-container");

        // Create the new HTML
        let html = createBoardGameButtonsHTML(boardGames, "add-group-");

        // Append the html
        parent.innerHTML = html;

        // Create eventlisteners
        boardGames.forEach(boardGame => {
            let button = document.getElementById("add-group-" + boardGame.id + "-button");
            button.addEventListener("click", function () {
                selectedBoardGame = boardGame.id;
                imageButtonClicked(button, "board-game-select");
                createAddGroupTeamSizeSelectors(boardGame);
            })
        })
    }

    function createBoardGameButtonsHTML(boardGames, idStart, groups) {
        if (groups == null) {
            groups = "";
        }

        let html = "";
        boardGames.forEach(boardGame => {
            html += `
                <div class="game-button ${groups}board-game-select" id="${idStart + boardGame.id + "-button"}"></div>
                `
        });
        return html;
    }

    function createSubmitButton() {
        // Find parent
        let parent = document.getElementById("footer-buttons-container");

        // Create the html for the button
        let html = `
                <input class="submit-group-button filter-button" id="submit-game-request" type="button" value="Saada"/>
                <input class="reset-selections-button filter-button" id="reset-add-game-selections" type="button" value="Tühista valikud"/>
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

    function filterGroupsList(game, gamemode, subGamemode, rank, boardGame) {
        let listItemHidden = "list-item-hidden";
        if (boardGame != null || game != null) {
            // Get all list game elements
            let listEntries = document.getElementsByClassName("group-request-item-game");
            for (let i = 0; i < listEntries.length; i++) {

                if (boardGame) {
                    let gameName = listEntries[i].attributes.getNamedItem("data-board-game").value;
                    let parent = listEntries[i].parentElement;
                    if (gameName !== boardGame) {
                        if (!parent.classList.contains(listItemHidden)) {
                            parent.classList.add(listItemHidden);
                        }
                    }
                    else {
                        parent.classList.remove(listItemHidden);
                    }
                }
                else if (game) {
                    let gameName = listEntries[i].attributes.getNamedItem("data-game").value;
                    let parent = listEntries[i].parentElement;
                    if (gameName !== game) {
                        if (!parent.classList.contains(listItemHidden)) {
                            parent.classList.add(listItemHidden);
                        }
                    }
                    else {
                        parent.classList.remove(listItemHidden);
                    }
                }
            }
        }

        if (gamemode != null) {
            // Get all list data elements
            let listEntries = document.getElementsByClassName("group-request-item-data");
            for (let i = 0; i < listEntries.length; i++) {
                let gamemodeId = listEntries[i].attributes.getNamedItem("data-gamemode").value;
                let parent = listEntries[i].parentElement;
                if (!parent.classList.contains(listItemHidden)) {
                    if (gamemodeId !== gamemode) {
                        parent.classList.add(listItemHidden);
                    } else {
                        parent.classList.remove(listItemHidden);
                    }
                }
            }
        }

        if (subGamemode != null) {
            // Get all list data elements
            let listEntries = document.getElementsByClassName("group-request-item-data");
            for (let i = 0; i < listEntries.length; i++) {
                let subGamemodeId = listEntries[i].attributes.getNamedItem("data-subgamemode").value;
                let parent = listEntries[i].parentElement;
                if (!parent.classList.contains(listItemHidden)) {
                    if (subGamemodeId !== subGamemode) {
                        parent.classList.add(listItemHidden);
                    }
                    else {
                        parent.classList.remove(listItemHidden);
                    }
                }
            }
        }
        if (rank != null) {
            // Get all list data elements
            let listEntries = document.getElementsByClassName("group-request-item-data");
            for (let i = 0; i < listEntries.length; i++) {
                let parent = listEntries[i].parentElement;
                if (!parent.classList.contains(listItemHidden)) {
                    // Check if entry has ranks info
                    let ranksList = listEntries[i].attributes.getNamedItem("data-ranks").value;
                    if (ranksList != null && ranksList.length > 0) {
                        let ranksArray = convertStringListToArray(ranksList);
                        if (ranksArray.includes(rank)) {
                            parent.classList.remove(listItemHidden)
                        }
                        else {
                            if (!parent.classList.contains(listItemHidden)) {
                                parent.classList.add(listItemHidden);
                            }
                        }
                    }
                }
            }
        }
        if (game == null && gamemode == null && subGamemode == null && rank == null && boardGame == null) {
            // Find all hidden rows
            let listEntries = document.getElementsByClassName(listItemHidden);
            for (let i = listEntries.length - 1; i >= 0; i--) {
                listEntries[i].classList.remove(listItemHidden);
            }
        }
    }

    function convertStringListToArray(list) {
        return list.split(", ");
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

    function selectRank(rank, button, gameId, gamemodeId, subGamemodeId) {
        let buttons = document.getElementsByClassName("groups-rank-select");
        for (let i = 0; i<buttons.length; i++) {
            if (buttons[i] !== button) {
                buttons[i].classList.remove("selected-filter-button");
            }
        }
        if (!button.classList.contains("selected-filter-button")) {
            button.classList.add("selected-filter-button");
        }
        filterGroupsList(gameId, gamemodeId, subGamemodeId, rank, null);

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
            otherButtonsAtSameHierarchy[i].classList.remove("selected-filter-button")
            otherButtonsAtSameHierarchy[i].classList.remove("selected-button")
        }
    }

    function removeUnneccessaryFilters(gamemode, subGamemode, rank, teamSize, boardGame, groupsFilter) {
        let groupsPrefix = "";
        if (groupsFilter) {
            groupsPrefix = "groups-";
        }
        if (gamemode) {
            removeFilters(groupsPrefix + "gamemode-select");
            selectedGamemode = null;
        }
        if (subGamemode) {
            removeFilters(groupsPrefix + "sub-gamemode-select");
            selectedSubGamemode = null;
        }
        if (rank) {
            removeFilters(groupsPrefix + "rank-select");
            selectedRanks.clear();
        }
        if (teamSize) {
            removeFilters(groupsPrefix + "team-size-select");
            removeFilters("submit-group-button");
            removeFilters("reset-selections-button");
            selectedTeamSize = null;
        }
        if (boardGame) {
            removeFilters(groupsPrefix + "board-game-select");
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
                createAddGroupGameButtons(data);
                createListFilters(data);
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
