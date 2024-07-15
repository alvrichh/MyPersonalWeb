
'use strict';
import '../css/style.css'

// navbar variables
const nav = document.querySelector('.mobile-nav');
const navMenuBtn = document.querySelector('.nav-menu-btn');
const navCloseBtn = document.querySelector('.nav-close-btn');


// navToggle function
const navToggleFunc = function () { nav.classList.toggle('active'); }

navMenuBtn.addEventListener('click', navToggleFunc);
navCloseBtn.addEventListener('click', navToggleFunc);

// Constants
const authorElements = document.querySelectorAll('.author');
authorElements.forEach(function(element) {
    element.textContent = "alvrich";
});
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
loadMoreBtn.addEventListener('click', () => {
  loadMoreBtn.classList.add('hidden');
  loadingSpinner.classList.remove('hidden');
  setTimeout(() => {
    // Add more blog cards dynamically here
    loadMoreBtn.classList.remove('hidden');
    loadingSpinner.classList.add('hidden');
  }, 2000);
});

const newsletterForm = document.getElementById('newsletterForm');
const subscriptionModal = document.getElementById('subscriptionModal');
const closeModal = document.querySelector('.close');

newsletterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  subscriptionModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
  subscriptionModal.classList.add('hidden');
});


// theme toggle variables
const themeBtn = document.querySelectorAll('.theme-btn');


for (let i = 0; i < themeBtn.length; i++) {

  themeBtn[i].addEventListener('click', function () {

    // toggle `light-theme` & `dark-theme` class from `body`
    // when clicked `theme-btn`
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');

    for (let i = 0; i < themeBtn.length; i++) {

      // When the `theme-btn` is clicked,
      // it toggles classes between `light` & `dark` for all `theme-btn`.
      themeBtn[i].classList.toggle('light');
      themeBtn[i].classList.toggle('dark');

    }

  })

}