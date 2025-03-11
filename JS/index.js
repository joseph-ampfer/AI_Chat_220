const JSON_BLOB_URL = "https://jsonblob.com/api/jsonBlob/1346491622271148032";
const divRow = document.getElementById("web-content");
let state = {
  'querySet': [],

  'page': 1,
  'rows': 9,

}
posts = []; // array that will be used to store the JSONBlob data when called and will be used to display posts.
document.getElementById("userSearch").addEventListener("keyup", searchBar); // listen for user to use search bar and then run the searchBar function.

/* Function to fetch the JSONBlob that holds the public posts and chats. */
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  return response.json();
}

/* Function to load all of the posts to the page. scrollDown is used for when a user clicks the next page. */
async function loadPosts(scrollDown = false) {
  posts = await fetchJSON(JSON_BLOB_URL);

  state.querySet = posts;
  let data = pagination(state.querySet, state.page, state.rows);
  displayPosts(data.querySet);
  pageButtons(data.pages);

  if (scrollDown) {
    document.getElementById("web-content").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* This function displays all posts in an ordered way using bootstrap cards. */
function displayPosts(filteredPosts) {
  divRow.innerHTML = "";

  filteredPosts.forEach(post => {
    let postCol = document.createElement("div");
    postCol.classList.add("col-12", "col-md-6", "col-lg-4");

    let postCard = document.createElement("div");
    postCard.classList.add("card");
    postCard.style.width = "20rem";
    postCard.style.margin = "auto";

    let cardData = document.createElement("div");
    cardData.classList.add("card-body");

    let cardTitle = document.createElement("h5");
    cardTitle.classList.add("card-title");
    cardTitle.innerText = post.chat_summary["title"];
    cardData.appendChild(cardTitle);

    let cardAuthor = document.createElement("h6");
    cardAuthor.innerText = `Chat by: ${post.username}`;
    cardData.appendChild(cardAuthor);

    let cardText = document.createElement("p");
    cardText.innerText = post.chat_summary["summary"];
    cardData.appendChild(cardText);

    let cardLink = document.createElement("a");
    cardLink.setAttribute("href", "chats.html");
    cardLink.classList.add("card-link");
    cardLink.innerText = "Check out this Conversation";
    cardData.appendChild(cardLink);

    postCard.appendChild(cardData);
    postCol.appendChild(postCard);
    divRow.appendChild(postCol);
  });
}

/* This function handles the cases of the user using the search bar to find posts on the website. */
function searchBar() {
  let input = document.getElementById("userSearch").value.toLowerCase(); // search input that is then turned lowercase to filter.
  let searchBar = document.getElementById("searchbar"); // grabbing the searchbar for animations
  let resultsContainer = document.getElementById("web-content"); // section of the document that will show the results.
  let sectionHeader = document.getElementById("sectionHeader"); // header of the results section that will change based on use of search bar.
  let paginationWrapper = document.getElementById("pagination-wrapper"); // pagination wrapper section, will be hidden during searches.

  let filteredPosts = posts.filter(post =>
    post.chat_summary["title"].toLowerCase().includes(input) // variable that will filter the titles of each of the posts that include what is in the input. Uses the array filter method
  );

  displayPosts(filteredPosts); // load all of the posts using the filtered posts.

  /* These sets of conditionals deal with the animations based on user interaction with the searchbar. */
  if (input === "") {  // If there is no input in the search bar, the search bar moves back to its original location and the header is changed back to show all recent posts.
    searchBar.style.marginTop = "0px";
    window.scrollTo({ top: 0, behavior: "smooth" });
    sectionHeader.innerText = "Recent AI Posts from our Users";
    paginationWrapper.style.display = "block";
    loadPosts();
  } else if (filteredPosts.length > 0) { // If there are search results, move the search bar and scroll screen to search results and change the header to 'Search Results'.
    searchBar.style.transition = "all 0.5s ease-in-out";
    searchBar.style.marginTop = "800px";
    resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    sectionHeader.innerText = "Search Results";
    paginationWrapper.style.display = "none";
  } else { // If there are no results, move search bar back to original position and scroll the screen to show the 'results not found' message.
    searchBar.style.marginTop = "0px";
    sectionHeader.innerText = "No Results Found :(";
    resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    paginationWrapper.style.display = "none";
  }
}


function pagination(querySet, page, rows) {
  let trimStart = (page - 1) * rows;
  let trimEnd = trimStart + rows;

  let trimmedData = querySet.slice(trimStart, trimEnd);

  let pages = Math.ceil(querySet.length / rows);

  return {
    'querySet': trimmedData,
    'pages': pages
  }
}

function pageButtons(pages) {
  let wrapper = document.getElementById('pagination-wrapper');
  wrapper.innerHTML = '';

  let prevButton = document.createElement("button");
  prevButton.innerText = "Previous";
  prevButton.classList.add("btn", "btn-secondary", "page-nav");
  prevButton.disabled = state.page === 1;
  prevButton.addEventListener("click", function () {
    if (state.page > 1) {
      state.page--;
      loadPosts(true);
    }
  });
  wrapper.appendChild(prevButton);


  for (let page = 1; page <= pages; page++) {
    let button = document.createElement("button");
    button.value = page;
    button.classList.add("page", "btn", "btn-secondary");
    button.innerText = page;

    if (page === state.page) {
      button.classList.add("active");
    }

    button.addEventListener("click", function () {
      state.page = parseInt(this.value);
      loadPosts(true);
    });

    wrapper.appendChild(button);
  };

  let nextButton = document.createElement("button");
  nextButton.innerText = "Next";
  nextButton.classList.add("btn", "btn-secondary", "page-nav");
  nextButton.disabled = state.page === pages;
  nextButton.addEventListener("click", function () {
    if (state.page < pages) {
      state.page++;
      loadPosts(true);
    }
  });
  wrapper.appendChild(nextButton);
}
loadPosts();
