// Redirect if not logged in
const JSON_BLOB_URL = localStorage.getItem("MyBlobURL");
const USERNAME = localStorage.getItem("username");

if (!JSON_BLOB_URL || !USERNAME) {
  window.location.replace("login.html");
}

// Constants
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const PUBLIC_POSTS_URL =
  "https://jsonblob.com/api/jsonBlob/1346491622271148032";
const chatHistory = document.querySelector("#chatHistory");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("userMessage");
const modelDropdown = document.querySelector("#modelSelect");
const modelBtn = document.querySelector("#modelSelect-btn");
const imageInput = document.getElementById("imageUpload");
const chatSection = document.getElementById("chat-section");
const textModelsHTML = `
        <li><a class="dropdown-item" href="#" >qwen-2.5-coder-32b</a></li>
        <li><a class="dropdown-item" href="#" >llama-3.3-70b-versatile</a></li>
        <li><a class="dropdown-item" href="#" >deepseek-r1-distill-qwen-32b</a></li>
        <li><a class="dropdown-item" href="#" >gemma2-9b-it</a></li>
        <li><a class="dropdown-item" href="#" >llama-3.2-90b-vision-preview</a></li>`;

// Global Variables
let conversation = [];
let blobData = {};
let currentChatIndex = -1;
let model = modelBtn.innerText.trim();
let uploadedImageBase64 = null;
let modelTracking = {};
let selectedPublicChat = {};

// If a chat to view is in session storage, display it.
// MOVED TO TOP FOR FASTER LOADING
let publicChatConvo = sessionStorage.getItem("selectedPublicChat");
console.log(publicChatConvo);
if (publicChatConvo) {
  chatMessages.innerHTML = `<div class="spinner-border " role="status">
            <span class="visually-hidden">Loading...</span>
          </div>`;
  loadChatByChat(JSON.parse(publicChatConvo));
}

// Automatic scroll with response
const observer = new MutationObserver(() => {
  chatSection.scrollTop = chatSection.scrollHeight;
});
observer.observe(chatSection, { childList: true, subtree: true });

// Handle Image Upload
// Global variable to keep track of the last file name
let lastFileName = "";

imageInput.addEventListener("change", function (event) {
  console.log("Image input change event triggered.");

  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected.");
    return;
  }

  // Log detailed information about the file
  console.log(
    "File selected:",
    file.name,
    "Size:",
    file.size,
    "Type:",
    file.type,
    "Last Modified:",
    new Date(file.lastModified).toLocaleString()
  );

  // Check if the same file is being selected again
  if (lastFileName === file.name) {
    console.log("The same file has been selected as before.");
  } else {
    console.log("A new file has been selected.");
  }
  lastFileName = file.name;

  const reader = new FileReader();

  reader.onload = function () {
    // The result is a Data URL that includes the base64 string
    const dataURL = reader.result;
    console.log(
      "Data URL generated (first 50 chars):",
      dataURL.substring(0, 50) + "..."
    );
    uploadedImageBase64 = dataURL;
    //displayImagePreview(dataURL);
  };

  // Read the file as a Data URL (base64 encoded)
  reader.readAsDataURL(file);
});

// Display Image Preview in Chat
function displayImagePreview(imageBase64) {
  const imgDiv = document.createElement("div");
  imgDiv.classList.add("text-end", "mb-3");
  imgDiv.innerHTML = `<img src="${imageBase64}" class="img-thumbnail" style="max-width: 200px;">`;
  chatMessages.appendChild(imgDiv);
}

// Display generated image
function displayGeneratedImage(imageBase64) {
  const imgDiv = document.createElement("div");
  imgDiv.classList.add("mb-3", "mx-auto");
  imgDiv.innerHTML = `<img src="${imageBase64}" class="img-fluid" style="max-width: 400px;">`;
  chatMessages.appendChild(imgDiv);
}

// Model select functionality model-select modelDropdown
attachModelDropdownListeners();

// New chat function
function newChat() {
  // Clear screen
  chatMessages.innerHTML = `<div class="d-flex align-items-center justify-content-center text-center h-100" role="status">
              <h2 class="">Hello! How can I assist you today?</h2>
            </div>`;
  // Clear local conversation
  conversation = [];
  // Set current index to a temporary value indicating "new unsaved chat"
  currentChatIndex = -1;
  // Remove selected chat highlight
  document.querySelector(".selectedChat")?.classList.remove("selectedChat");
  // Make dropdown and model correct
  modelBtn.innerText = "gemma2-9b-it";
  modelDropdown.innerHTML = textModelsHTML;
  model = "gemma2-9b-it";
  // Model select
  attachModelDropdownListeners();
}
// Attach to new chat button
document
  .querySelector("#new-chat-btn")
  .addEventListener("click", () => newChat());

// New image generation chat function
function newImageChat() {
  // Clear screen
  chatMessages.innerHTML = `<div class="d-flex align-items-center justify-content-center text-center h-100" role="status">
              <h2 class="">Turning text into reality.</h2>
            </div>`;
  // Clear local conversation
  conversation = [];
  // Set current index to a temporary value indicating "new unsaved chat"
  currentChatIndex = -1;
  // Remove selected chat highlight
  document.querySelector(".selectedChat")?.classList.remove("selectedChat");
  modelBtn.innerText = "Image";
  modelDropdown.innerHTML = "";
  model = "image";
}
document
  .querySelector("#img-220-btn")
  .addEventListener("click", () => newImageChat());

// Helper: Fetch JSON from URL
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  return response.json();
}

// Helper: Update JSON Blob with blobData directly
async function updateJSONBlob(url, data) {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Update JSON Blob failed: ${response.statusText}`);
  }
}

// Helper: Display message in chat
function appendMessage(message, isUser = true, model2 = "Unkown model") {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("mb-3");
  if (isUser) {
    messageDiv.innerHTML = `<div class="bg-primary user-message" >${message}</div>`;
  } else {
    messageDiv.innerHTML = marked.parse(message);

    // Make copy button
    const copyButton = makeCopyBtn(message);

    // Make div
    const bottomInfo = document.createElement("div");

    // Make model text
    const modelSpan = document.createElement("span");
    modelSpan.classList.add("blockquote-footer");
    modelSpan.innerText = model2;
    bottomInfo.appendChild(modelSpan);
    bottomInfo.appendChild(copyButton);

    messageDiv.appendChild(bottomInfo);
  }
  chatMessages.appendChild(messageDiv);
}

// Load chats for side bar
async function loadSideBar() {
  // Group the chats, get result
  const groupedChats = groupChatsByDate(blobData.chats);

  // Order in which we want to display groups
  const sections = ["Today", "Yesterday", "Previous 7 Days", "Older"];

  // Remove placeholder
  chatHistory.innerHTML = "";

  // Go through each section, using section as a key for grouped chats
  sections.forEach((section) => {
    if (groupedChats[section].length > 0) {
      // Create header label
      let header = document.createElement("li");
      header.classList.add("list-group-item", "fw-bold", "bg-light");
      header.innerText = section;
      chatHistory.appendChild(header);

      // Append chats under the corresponding header
      // Going backwards to assume higher index is more recent
      for (let i = groupedChats[section].length - 1; i >= 0; i--) {
        let title = groupedChats[section][i].chat.title;
        let li = document.createElement("li");
        li.classList.add(
          "list-group-item",
          "d-flex",
          "justify-content-between"
        );
        li.dataset.index = groupedChats[section][i].index;

        // Create a span to hold the chat title
        let titleSpan = document.createElement("span");
        titleSpan.innerText = title;
        li.appendChild(titleSpan);

        // When clicking the li (outside of the options), load the chat.
        li.addEventListener("click", () =>
          loadChatByIndex(groupedChats[section][i].index)
        );

        let chatOptionsWrapper = document.createElement("div");
        chatOptionsWrapper.classList.add("chat-options-wrapper");
        li.appendChild(chatOptionsWrapper);

        let threeDotsBtn = document.createElement("button");
        threeDotsBtn.classList.add("three-dots-btn");
        threeDotsBtn.innerHTML = `<i class="bi bi-three-dots"></i>`;
        chatOptionsWrapper.appendChild(threeDotsBtn);

        let chatOptions = document.createElement("div");
        chatOptions.classList.add("chat-options");
        chatOptionsWrapper.appendChild(chatOptions);
        let renameChatBtn = document.createElement("button");
        renameChatBtn.classList.add(
          "rename-chat",
          "btn",
          "d-flex",
          "justify-content-between",
          "text-end"
        );
        renameChatBtn.innerHTML = `<i class="bi bi-pencil me-3"></i><span>Rename</span>`;
        chatOptions.appendChild(renameChatBtn);
        let deleteChatBtn = document.createElement("button");
        deleteChatBtn.classList.add(
          "delete-chat",
          "text-danger",
          "btn",
          "text-end"
        );
        deleteChatBtn.innerHTML = `<i class="bi bi-trash3 me-3"></i><span>Delete</span>`;
        chatOptions.appendChild(deleteChatBtn);

        // Three dots button toggles the popup
        threeDotsBtn.addEventListener("click", function (event) {
          event.stopPropagation();
          chatOptions.classList.toggle("show");
        });

        // Delete button event listener
        deleteChatBtn.addEventListener("click", function (event) {
          event.stopPropagation();
          li.remove();
          deleteChatbyIndex(groupedChats[section][i].index);
        });

        // Rename button event listener
        renameChatBtn.addEventListener("click", function (event) {
          event.stopPropagation();
          chatOptions.classList.remove("show"); // Hide popup

          // Prompt user for new chat title. You can also create an inline input instead.
          const newTitle = prompt("Enter new chat title:", titleSpan.innerText);
          if (newTitle !== null && newTitle.trim() !== "") {
            titleSpan.innerText = newTitle;
            // Optionally update your groupedChats data structure or send to your backend
            blobData.chats[groupedChats[section][i].index].title = newTitle;
            updateJSONBlob(JSON_BLOB_URL, blobData);
          }
        });

        chatHistory.appendChild(li);
      }
    }
  });
}
// Close the options popup when clicking outside
document.addEventListener("click", function (event) {
  document.querySelectorAll(".chat-options.show").forEach((popup) => {
    // The parent of the chatOptions is the wrapper that contains both the button and the options.
    // If the click target isn't within that wrapper, hide the popup.
    if (!popup.parentElement.contains(event.target)) {
      popup.classList.remove("show");
    }
  });
});

// Grouping chats by date to get to load sidebar
function groupChatsByDate(chats) {
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).getTime();
  const yesterdayStart = todayStart - 86400000; // 1 day before start
  const weekStart = todayStart - 7 * 86400000; // 7 days before start

  const grouped = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  chats.forEach((chat, index) => {
    const chatTime = new Date(chat.timestamp).getTime() || 0;

    let group;
    if (chatTime >= todayStart) {
      group = "Today";
    } else if (chatTime >= yesterdayStart) {
      group = "Yesterday";
    } else if (chatTime >= weekStart) {
      group = "Previous 7 Days";
    } else {
      group = "Older";
    }

    grouped[group].push({ chat, index }); // Keep the original index
  });

  return grouped;
}

function loadChatByIndex(index) {
  chatMessages.innerHTML = "";
  const selectedChat = blobData.chats[index];

  if (selectedChat && selectedChat.conversation) {
    // Check if image generator chat, change model select
    if (selectedChat.isImageChat) {
      modelBtn.innerText = "Image";
      modelDropdown.innerHTML = "";
      model = "image";
    } else {
      modelBtn.innerText = "gemma2-9b-it";
      modelDropdown.innerHTML = textModelsHTML;
      attachModelDropdownListeners();
      model = "gemma2-9b-it";
    }

    conversation = selectedChat.conversation;
    modelTracking = selectedChat.modelTracking || {}; // Ensure modelTracking is an object

    // Display chat history with append message
    for (let i = 0; i < conversation.length; i++) {
      // If content is an array, assume image formatting and display the image
      if (Array.isArray(conversation[i].content)) {
        if (conversation[i].content.length > 1) {
          if (conversation[i].role == "user") {
            displayImagePreview(conversation[i].content[1]?.image_url.url);
          } else {
            displayGeneratedImage(conversation[i].content[1]?.image_url.url);
          }
        }
        appendMessage(conversation[i].content[0].text);
      } else {
        appendMessage(
          conversation[i].content,
          conversation[i].role == "user",
          modelTracking[i]
        );
      }
    }
    currentChatIndex = index;
    hljs.highlightAll();
    console.log("Loaded chat by index:", currentChatIndex);
    console.log(conversation);
  }
  document.querySelector(".selectedChat")?.classList.remove("selectedChat");
  document
    .querySelector(`[data-index="${currentChatIndex}"]`)
    .classList.add("selectedChat");
}

function loadChatByChat(chat) {
  chatMessages.innerHTML = "";
  selectedPublicChat = chat;
  const selectedChat = chat;

  if (selectedChat && selectedChat.conversation) {
    // Check if image generator chat, change model select
    if (selectedChat.isImageChat) {
      modelBtn.innerText = "Image";
      modelDropdown.innerHTML = "";
      model = "image";
    } else {
      modelBtn.innerText = "gemma2-9b-it";
      modelDropdown.innerHTML = textModelsHTML;
      model = "gemma2-9b-it";
    }

    conversation = selectedChat.conversation;
    modelTracking = selectedChat.modelTracking || {}; // Ensure modelTracking is an object

    // Display chat history with append message
    for (let i = 0; i < conversation.length; i++) {
      // If content is an array, assume image formatting and display the image
      if (Array.isArray(conversation[i].content)) {
        if (conversation[i].content.length > 1) {
          if (conversation[i].role == "user") {
            displayImagePreview(conversation[i].content[1]?.image_url.url);
          } else {
            displayGeneratedImage(conversation[i].content[1]?.image_url.url);
          }
        }
        appendMessage(conversation[i].content[0].text);
      } else {
        appendMessage(
          conversation[i].content,
          conversation[i].role == "user",
          modelTracking[i]
        );
      }
    }
    currentChatIndex = -2;
    hljs.highlightAll();
    console.log("Loaded chat by chat:", currentChatIndex);
    console.log(conversation);
  }
  // Remove selected chat from session storage
  sessionStorage.removeItem("selectedPublicChat");
  // document.querySelector('.selectedChat')?.classList.remove('selectedChat');
  // document.querySelector(`[data-index="${currentChatIndex}"]`).classList.add('selectedChat');
}

// Load conversation history from jsonBlob
async function loadChat() {
  try {
    blobData = await fetchJSON(JSON_BLOB_URL);
    // Ensure blobData.chats exists; if not, you might initialize it
    if (!blobData.chats) {
      blobData.chats = [];
    }

    // Load chat history (titles) into the aside
    await loadSideBar();

    // Optionally load the first chat automatically:
    //newChat();
  } catch (error) {
    console.error("Failed to load chat:", error);
  }
}

function addToSidebar(title, index) {
  //let title = groupedChats[section][i].chat.title;
  let li = document.createElement("li");
  li.classList.add("list-group-item", "d-flex", "justify-content-between");
  li.dataset.index = index;

  // Create a span to hold the chat title
  let titleSpan = document.createElement("span");
  titleSpan.innerText = title;
  li.appendChild(titleSpan);

  // When clicking the li (outside of the options), load the chat.
  li.addEventListener("click", () => loadChatByIndex(index));

  let chatOptionsWrapper = document.createElement("div");
  chatOptionsWrapper.classList.add("chat-options-wrapper");
  li.appendChild(chatOptionsWrapper);

  let threeDotsBtn = document.createElement("button");
  threeDotsBtn.classList.add("three-dots-btn");
  threeDotsBtn.innerHTML = `<i class="bi bi-three-dots"></i>`;
  chatOptionsWrapper.appendChild(threeDotsBtn);

  let chatOptions = document.createElement("div");
  chatOptions.classList.add("chat-options");
  chatOptionsWrapper.appendChild(chatOptions);
  let renameChatBtn = document.createElement("button");
  renameChatBtn.classList.add(
    "rename-chat",
    "btn",
    "d-flex",
    "justify-content-between",
    "text-end"
  );
  renameChatBtn.innerHTML = `<i class="bi bi-pencil me-3"></i><span>Rename</span>`;
  chatOptions.appendChild(renameChatBtn);
  let deleteChatBtn = document.createElement("button");
  deleteChatBtn.classList.add("delete-chat", "text-danger", "btn", "text-end");
  deleteChatBtn.innerHTML = `<i class="bi bi-trash3 me-3"></i><span>Delete</span>`;
  chatOptions.appendChild(deleteChatBtn);

  // Three dots button toggles the popup
  threeDotsBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    chatOptions.classList.toggle("show");
  });

  // Delete button event listener
  deleteChatBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    li.remove();
    deleteChatbyIndex(index);
  });

  // Rename button event listener
  renameChatBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    chatOptions.classList.remove("show"); // Hide popup

    // Prompt user for new chat title. You can also create an inline input instead.
    const newTitle = prompt("Enter new chat title:", titleSpan.innerText);
    if (newTitle !== null && newTitle.trim() !== "") {
      titleSpan.innerText = newTitle;
      // Optionally update your groupedChats data structure or send to your backend
      blobData.chats[index].title = newTitle;
      updateJSONBlob(JSON_BLOB_URL, blobData);
    }
  });

  chatHistory.prepend(li);
}

// Send user message and get bot response
async function sendMessageToAI(message) {
  try {
    // Check if we're in a NEW unsaved chat
    if (currentChatIndex === -1) {
      chatMessages.innerHTML = "";
      // Create new chat entry with the first message as title
      const title = message.split(" ").slice(0, 3).join(" ");

      // add to blobData
      blobData.chats.push({
        title: title,
        timestamp: "",
        modelTracking: {},
        conversation: [],
        isImageChat: false,
      });

      // Set current index to the new chat
      currentChatIndex = blobData.chats.length - 1;

      // Add to sidebar
      addToSidebar(title, currentChatIndex);
    } else if (currentChatIndex == -2) {
      // Loaded message from index page
      // Save public chat to end of your chats
      blobData.chats.push(selectedPublicChat);

      // Set current index to the new chat
      currentChatIndex = blobData.chats.length - 1;

      // Add to sidebar
      let li = document.createElement("li");
      li.classList.add("list-group-item", "selectedChat");
      li.innerText = selectedPublicChat.title;
      let newIndex = currentChatIndex;
      li.dataset.index = newIndex;
      li.addEventListener("click", () => loadChatByIndex(newIndex));
      document.querySelector("#chatHistory").prepend(li);
    }

    let currentModel = model;

    // Check if using image model
    let messageContent;
    if (currentModel == "llama-3.2-90b-vision-preview") {
      messageContent = [{ type: "text", text: message }];
      if (uploadedImageBase64) {
        messageContent.push({
          type: "image_url",
          image_url: { url: uploadedImageBase64 },
        });
        displayImagePreview(uploadedImageBase64);
        // Only one image per chat
        imageInput.classList.add("d-none");
      }
    } else {
      messageContent = message;
    }

    // Display message
    appendMessage(message); // Display user message

    // Add message to conversation
    conversation.push({ role: "user", content: messageContent });

    if (model == "image") {
      await generateImage(message);
    } else {
      // Send request to ai api
      const response = await fetch("api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer <REPLACE-WITH-JWT>`,
        },
        body: JSON.stringify({ messages: conversation, model: currentModel }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const botMessage = await response.text() ?? "No response.";
      //===old==
      // const resJson = await response.json();
      // const botMessage =
      //   resJson.choices?.[0]?.message?.content ?? "No response.";
      //====
      appendMessage(botMessage, false, currentModel); // Display bot response
      hljs.highlightAll(); // Highlight code

      // Update conversation
      conversation.push({ role: "assistant", content: botMessage });

      // Update modelTracking
      modelTracking[conversation.length - 1] = currentModel;

      // Update local blob and send to jsonBlob
      await updateChatBlob();
    }
  } catch (error) {
    console.error("Request failed:", error);
    appendMessage("🚫 Oops! Something went wrong. Please try again.", false);
  } finally {
    uploadedImageBase64 = null;
    imageInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
  }
}

// Helper: make copy button
function makeCopyBtn(toCopy) {
  // Create copy button for chatContent
  const copyButton = document.createElement("button");
  copyButton.title = "Copy";
  copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 17">
            <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
          </svg>`;
  copyButton.classList.add("btn");

  // Add copy functionality
  copyButton.addEventListener("click", function () {
    //const text = botMessage;
    navigator.clipboard
      .writeText(toCopy)
      .then(() => {
        // Mark done and then revert back
        copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0"/>
                </svg>`;
        setTimeout(() => {
          copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 17">
                    <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                  </svg>`;
        }, 1000);
      })
      .catch((err) => console.error("Failed to copy: ", err));
  });
  return copyButton;
}

// Handle enter press in textarea
messageInput.addEventListener("keypress", function (event) {
  if (event.key == "Enter" && !event.shiftKey) {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
      sendMessageToAI(message);
      messageInput.value = ""; // Clear input
    }
  }
});

// Handle form submission (pressing submit, may change this later)
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message) {
    sendMessageToAI(message);
    messageInput.value = ""; // Clear input
  }
});

// Load the chat on page load
loadChat();

// Audio transcription!!!!
let isRecording = false;

// Define icon templates
const micIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-mic" viewBox="0 0 16 16">
          <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5"/>
          <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3"/>
        </svg>
      `;

const stopIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-stop-circle" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
          <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5z"/>
        </svg>
      `;

let audioStream;
let mediaRecorder;
let recordedChunks = [];
async function startRecording() {
  try {
    // Request access to the microphone
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Create a MediaRecorder instance
    mediaRecorder = new MediaRecorder(audioStream);

    // When data is available, push it to recordedChunks
    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    });

    // When recording stops, create a blob from the chunks and trigger a download
    mediaRecorder.addEventListener("stop", async () => {
      const blob = new Blob(recordedChunks, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("temperature", 0);
      formData.append("response_format", "json");
      formData.append("language", "en");

      const response = await fetch('/api/transcriptions',
        {
          method: "POST",
          headers: {
            Authorization: `Bearer <REPLACE-WITH-JWT>`,
            // Let the browser set the correct Content-Type header for FormData.
          },
          body: formData,
        }
      );
      const result = await response.json();
      console.log("Transcription result:", result);
      console.log(result.text);
      sendMessageToAI(result.text);

      recordedChunks = [];
    });

    mediaRecorder.start();
    console.log("Recording started");
  } catch (err) {
    console.error("Error accessing the microphone", err);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    audioStream.getTracks().forEach((track) => track.stop());
    console.log("Recording stopped and microphone released");
  }
}

function toggleRecording() {
  const toggleBtn = document.getElementById("toggle-recording");
  if (isRecording) {
    stopRecording();
    toggleBtn.classList.remove("btn-danger");
    toggleBtn.classList.add("btn-primary");
    toggleBtn.innerHTML = micIcon; // Show mic icon
  } else {
    startRecording();
    toggleBtn.classList.remove("btn-primary");
    toggleBtn.classList.add("btn-danger");
    toggleBtn.innerHTML = stopIcon; // Show stop icon
  }
  isRecording = !isRecording;
}

// Helper function to convert a blob to a Base64 string
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// image generator
async function generateImage(message, imageModel = "") {
  // Display placehoder the image in an <img> tag
  const placeholder = document.createElement("div");
  placeholder.classList.add(
    "bg-secondary",
    "rounded",
    "d-flex",
    "align-items-center",
    "justify-content-center"
  );
  placeholder.style.width = "400px";
  placeholder.style.height = "400px";
  placeholder.style.margin = "";
  placeholder.innerHTML = `
          <div class="spinner-border text-light " role="status">
            <span class="visually-hidden">Loading...</span>
          </div>`;

  chatMessages.appendChild(placeholder);

  const response = await fetch(`https://midterm.jampfer.workers.dev/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: message }),
  });

  if (!response.ok) {
    placeholder.remove();
    throw new Error("Error fetching image:", response.statusText);
  }

  // Convert the binary response to a blob
  const blob = await response.blob();

  // Create an object URL for the image
  const imageUrl = URL.createObjectURL(blob);

  // Display the image in an <img> tag
  const img = document.createElement("img");
  img.classList.add("img-fluid");
  img.src = imageUrl;
  img.alt = "Generate AI image";
  placeholder.innerHTML = "";
  placeholder.appendChild(img);

  // Convert the blob to a Base64 string
  const base64data = await blobToBase64(blob);

  // Keeping same format i had before of user uploaded images
  let messageContent = [
    { type: "text", text: "" },
    { type: "image_url", image_url: { url: base64data } },
  ];

  // Update conversation
  conversation.push({ role: "assistant", content: messageContent });

  // Update modelTracking
  modelTracking[conversation.length - 1] = model;

  // Update local blob and send to jsonBlob
  await updateChatBlob(true);
}

// Adds metadata to blob and then updates jsonBlob
async function updateChatBlob(isImageChat = false) {
  const timestamp = Date.now();
  blobData.chats[currentChatIndex].conversation = conversation;
  blobData.chats[currentChatIndex].modelTracking = modelTracking;
  blobData.chats[currentChatIndex].timestamp = timestamp;
  blobData.chats[currentChatIndex].isImageChat = isImageChat;
  await updateJSONBlob(JSON_BLOB_URL, blobData);
}

//generateImage("@cf/stabilityai/stable-diffusion-xl-base-1.0");

// Post a chat function!!!! postChat
document
  .querySelector("#postChat")
  .addEventListener("click", async function () {
    if (conversation.length <= 0) {
      alert("No conversation to post", false);
      return;
    }

    if (blobData.chats[currentChatIndex].isImageChat) {
      alert("Cannot post image chats", false);
      return;
    }

    try {
      let systemPrompt = {
        role: "system",
        content: `You an assistant that summarizes chats in JSON like they would appear in reddit. A title that is a question, and a detail that is a 30 word summary. The JSON schema should include
              {
                "chat_summary": {
                  "title": "string (as a question)",
                  "summary": "string (about 30 words)"
                }
              }`,
      };

      // Make new convo with system prompt at the beginning
      let convoWithSystemPrompt = [systemPrompt, ...conversation];

      // Send request to ai api
      const response = await fetch('/api/summarize-chat', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer <REPLACE-WITH-JWT>`,
        },
        body: JSON.stringify({
          messages: convoWithSystemPrompt,
          model: 'gemma2-9b-it',
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const resJson = await response.json();
      // console.log(resJson);
      // const botMessage =
      //   resJson.choices?.[0]?.message?.content ?? "No response.";
      const parsed = JSON.parse(resJson);

      let newPostData = {
        username: USERNAME,
        chat_summary: parsed.chat_summary,
        chat: blobData.chats[currentChatIndex],
      };

      let publicBlob = await fetchJSON(PUBLIC_POSTS_URL);
      console.log(publicBlob);
      publicBlob.push(newPostData);

      await updateJSONBlob(PUBLIC_POSTS_URL, publicBlob);

      alert("Posted :)");
    } catch (error) {
      console.error("Request failed:", error);
      alert("Problem posting, please try again.");
    }
  });

// Deleting chats
async function deleteChatbyIndex(index) {
  // Splice out indexed chat
  blobData.chats.splice(index, 1);
  // Send to jsonblob
  updateJSONBlob(JSON_BLOB_URL, blobData);
}

// SELECTING A MODEL LISTENERS
function attachModelDropdownListeners() {
  document.querySelectorAll("#modelSelect li a").forEach((e) => {
    e.addEventListener("click", function () {
      modelBtn.innerText = e.innerText;
      model = e.innerText.trim();
      if (model === "llama-3.2-90b-vision-preview") {
        imageInput.classList.remove("d-none");
      } else {
        imageInput.classList.add("d-none");
      }
    });
  });
}