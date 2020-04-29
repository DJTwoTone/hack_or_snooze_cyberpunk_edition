$(async function () {
    // cache some selectors we'll be using quite a bit
    const $allStoriesList = $("#all-articles-list");
    const $submitForm = $("#submit-form");
    const $filteredArticles = $("#filtered-articles");
    const $loginForm = $("#login-form");
    const $createAccountForm = $("#create-account-form");
    const $ownStories = $("#my-articles");
    const $navLogin = $("#nav-login");
    const $navLogOut = $("#nav-logout");

    const $articlesContainer = $(".articles-container");
    const $mainNavLinks = $("#main-nav-links");
    const $navSubmit = $("#nav-submit");
    const $myStories = $("#nav-my-stories");
    const $navFavs = $("#nav-favorites");
    const $favStories = $("#favorited-articles");
    const $userProfile = $("#user-profile");
    const $profileName = $("#profile-name");
    const $profileUsername = $("#profile-username");
    const $profileAccountDate = $("#profile-account-date")
  
    // global storyList variable
    let storyList = null;
  
    // global currentUser variable
    let currentUser = null;
  
    await checkIfLoggedIn();
  
  
    $loginForm.on("submit", async function (evt) {
      evt.preventDefault(); // no page-refresh on submit
  
      // grab the username and password
      const username = $("#login-username").val();
      const password = $("#login-password").val();
  
      // call the login static method to build a user instance
      const userInstance = await User.login(username, password);
      // set the global user to the user instance
      currentUser = userInstance;
      syncCurrentUserToLocalStorage();
      loginAndSubmitForm();
    });


  
    /**
     * Event listener for signing up.
     *  If successfully we will setup a new user instance
     */
  
    $createAccountForm.on("submit", async function (evt) {
      evt.preventDefault(); // no page refresh
  
      // grab the required fields
      let name = $("#create-account-name").val();
      let username = $("#create-account-username").val();
      let password = $("#create-account-password").val();
  
      // call the create method, which calls the API and then builds a new user instance
      const newUser = await User.create(username, password, name);
      currentUser = newUser;
      syncCurrentUserToLocalStorage();
      loginAndSubmitForm();
    });
  
    /**
     * Log Out Functionality
     */
  
    $navLogOut.on("click", function () {
      // empty out local storage
      localStorage.clear();
      // refresh the page, clearing memory
      location.reload();
    });
  
    /**
     * Event Handler for Clicking Login
     */
  
    $navLogin.on("click", function () {
      // Show the Login and Create Account Forms
      hideElements();
      $loginForm.show();
      $createAccountForm.show();
    });
  
    /**
     * Event handler for Navigation to Homepage
     */
  
    $("body").on("click", "#nav-all", async function () {
      hideElements();
      $allStoriesList.show();
      await generateStories();
      hideElements();
      $allStoriesList.show();
      $userProfile.show();
      makeOwnStories();
    });
  
    /**
     * On page load, checks local storage to see if the user is already logged in.
     * Renders page information accordingly.
     */
  
    async function checkIfLoggedIn() {
      // let's see if we're logged in
      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");
      
      // if there is a token in localStorage, call User.getLoggedInUser
      //  to get an instance of User with the right details
      //  this is designed to run once, on page load
      loading();
      currentUser = await User.getLoggedInUser(token, username);
      loading();
      await generateStories();
  
      if (currentUser) {
        currentUserInfo();
        showNavForLoggedInUser();
        makeFavs();
        makeOwnStories();
      }
    }
  
    /**
     * A rendering function to run to reset the forms and hide the login info
     */
  
    async function loginAndSubmitForm() {
      // hide the forms for logging in and signing up
      hideElements();
  
      // reset those forms
      $loginForm.trigger("reset");
      $createAccountForm.trigger("reset");
  
      // show the stories
      await generateStories();
      $allStoriesList.show();

      // male and show the currentuser
      currentUserInfo();
      $userProfile.show();
  
      // update the navigation bar
      showNavForLoggedInUser();
    }
  
    /**
     * A rendering function to call the StoryList.getStories static method,
     *  which will generate a storyListInstance. Then render it.
     */
  
    async function generateStories() {
      // get an instance of StoryList
      const storyListInstance = await StoryList.getStories();
      // update our global variable
      storyList = storyListInstance;
      // empty out that part of the page
      $allStoriesList.empty();
      // loop through all of our stories and generate HTML for them
      for (let story of storyList.stories) {
        let result = generateStoryHTML(story);
        // add stars where and when needed
        let starredResult = starResult(story, result);
        $allStoriesList.append(starredResult);   
      }
    }
      
      /**
     * A function to render HTML for an individual Story instance
     */
  
    function generateStoryHTML(story) {
      let hostName = getHostName(story.url);
  
      // render story markup
      const storyMarkup = $(`
          <li id="${story.storyId}">
          <a class="article-link" href="${story.url}" target="a_blank">
            <strong>${story.title}</strong>
            </a>
          <small class="article-author">by ${story.author}</small>
          <small class="article-hostname ${hostName}">(${hostName})</small>
          <small class="article-username">posted by ${story.username}</small>
        </li>
      `);
  
      return storyMarkup;
    }
    // a function for adding stars as needed to the story html
    function starResult(story, result) {
      if (currentUser) {
        let favStar = inFav(story) ? "fas" : "far";
        result.prepend(`
          <span class="star">
          <i class="${favStar} fa-star">
          </i>
          </span>`);
        return result;
      } else {
        return result;
      }
    }

    // a listener add to the body to listen to star clicks
    $articlesContainer.on('click', '.fa-star', async function (e) {
      
      let articleID = e.target.closest("li").id;
      let $target = $(e.target);
      if ($target.closest("i").hasClass("fas")) {
        loading();
        await currentUser.delFav(articleID);
        await currentUser.updateUserData();
        makeFavs();
        loading();
        await generateStories();
        $allStoriesList.show();
        $userProfile.show();
      } else {
        loading();
        await currentUser.addFav(articleID);
        await currentUser.updateUserData();
        makeFavs();
        loading();
        await generateStories();
        $allStoriesList.show();
        $userProfile.show();
      }
});
    


  
    /* hide all elements in elementsArr */
  
    function hideElements() {
      const elementsArr = [
        $submitForm,
        $allStoriesList,
        $filteredArticles,
        $ownStories,
        $loginForm,
        $createAccountForm,
        $favStories,
        $userProfile
      ];
      elementsArr.forEach(($elem) => $elem.hide());
    }
  
    // shows the logged in user nav bar
    function showNavForLoggedInUser() {
      $navLogin.hide();
      $navLogOut.show();
      $mainNavLinks.show();
    }

    // appends the current users info to the dom
    function currentUserInfo() {
      const name = currentUser.name;
      const username = currentUser.username;
      const created = currentUser.createdAt;

      $profileName.append(`    <b>${name}</b>`);
      $profileUsername.append(`    <b>${username}</b>`);
      $profileAccountDate.append(`    <b>${created}</b>`);
    }
  
    /* simple function to pull the hostname from a URL */
  
    function getHostName(url) {
      let hostName;
      if (url.indexOf("://") > -1) {
        hostName = url.split("/")[2];
      } else {
        hostName = url.split("/")[0];
      }
      if (hostName.slice(0, 4) === "www.") {
        hostName = hostName.slice(4);
      }
      return hostName;
    }
    
    /* sync current user information to localStorage */
    
    function syncCurrentUserToLocalStorage() {
      if (currentUser) {
        localStorage.setItem("token", currentUser.loginToken);
        localStorage.setItem("username", currentUser.username);
      }
    }
  
    $navSubmit.on("click", function (e) {
      hideElements();
      $submitForm.toggle();
    });
  
    $myStories.on("click", function (e) {
      hideElements();
      $ownStories.toggle()
    });
  
    $navFavs.on("click", function (e) {
      hideElements();
      $favStories.toggle();
    });
  
    $submitForm.on("submit", async function (e) {
      e.preventDefault();
      const author = $("#author").val();
      const title = $("#title").val();
      const url = $("#url").val();
      const newStory = {
        author,
        title,
        url,
      };
      $submitForm.trigger("reset");
      

      const storyObj = await storyList.addStory(currentUser, newStory);
      
      const storyHTML = generateStoryHTML(storyObj);
      
      // $allStoriesList.prepend(storyHTML);
      await makeOwnStories();
      await generateStories();
      hideElements();
      $allStoriesList.show();
      $userProfile.show();
    });
    

    // makes the stoires the user has submitted
    async function makeOwnStories() {
      $ownStories.empty();
     
        
        if (currentUser.ownStories.length === 0) {
          $ownStories.append(`
          <h3>My Stories</h3>
          <h5>No stories posted yet</h5>
          `);
        } else {
        for (let story of currentUser.ownStories) {
          let storyHTML = generateStoryHTML(story);
          storyHTML.prepend(
            `
          <span class="trash-can">
          <i class="fas fa-trash-alt">
          </i>
          </span>`
          );
          $ownStories.prepend(storyHTML);
        }
        $ownStories.prepend("<h3>My Stories<h3>");
      }

      const $trashcans = $(".trash-can");
      
      $trashcans.on("click", async function (e) {
        let articleID = e.target.closest("li").id;
        let $target = $(e.target);
        $ownStories.empty();
        await currentUser.delOwnStory(articleID);
        await generateStories();
        $allStoriesList.show();
        $userProfile.show();
    
        }); 
      
  }
  
  // a function to see if a story is in user favorites
    function inFav(story) {
      let favIDs = [];
      if (currentUser) {
        for (let fav of currentUser.favorites) {
          favIDs.push(fav.storyId);
        }
        return favIDs.includes(story.storyId);
      }
    }

    // a function to make favorite stories
    function makeFavs() {
      $favStories.empty();
      if (currentUser){
        if (currentUser.favorites.length === 0) {
          $favStories.append(`
          <h3>Favorite Stories</h3>
          <h5>Evidently, you haven't liked anything yet yet</h5>
          `);
        } else {
          for (let story of currentUser.favorites) {
            let favHTML = generateStoryHTML(story);
            $favStories.append(favHTML);
            }
        }
      }
    }

    // a little loading animation to improve UX
    function loading() {
      hideElements();
      $allStoriesList.empty();
      $allStoriesList.append(`<h3 class="typewriter">Loading...</h3>`);
      $allStoriesList.show();
      $userProfile.show();
    }


  
  });
  