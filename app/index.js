// REQUIRE
const path = require('path')
const os = require('os')
const slash = require('slash')
const { statSync } = require("fs");
const { ipcRenderer, shell } = require('electron');

// DOM
const displayOutputPath = document.getElementById('output-path')
const form = document.getElementById('image-form')
const slider = document.getElementById('slider')
const img = document.getElementById('img')
const displayImgSize = document.getElementById('img-size')
const submitBtn = document.querySelector('.btn-resize')
const toggleFlex = document.querySelector('.toggleFlex-container')
const main = document.querySelector('main')
const previewBtn = document.getElementById('btn-imgPreview')
const previewSection = document.querySelector('.img-preview-container')
const toads = document.querySelector('.toads')

// State
let showPreview = false;
let flexOn = false;
let inputFileSize, quality;

// Show output path
const outputPath = path.join(os.homedir(), 'Desktop/Img-Shrink/')
displayOutputPath.textContent = path.join(os.homedir(), 'Desktop/Img-Shrink')
displayOutputPath.addEventListener('click', () => { shell.openPath(outputPath) })


// PREVIEW btn - toggle image 
previewBtn.addEventListener('click', e => {
    previewSection.classList.toggle('toggleImg')
    showPreview = !showPreview
    // if (flexOn) showPreview ? main.style.flex = '0.1 9 auto' : main.style.flex = '1 1 auto'
    ipcRenderer.send('mainWin:resize', [showPreview, flexOn])
})

// FLEX btn - toggle flex
toggleFlex.addEventListener('click', e => {
    flexOn = !flexOn
    toggleFlex.childNodes[1].classList.toggle('change-toggleFlex')
    flexOn ? main.style.flex = '1 1 auto' : main.style.flex = '0 1 auto'
})

// BROWSE btn - change image
img.addEventListener('change', e => {
    submitBtn.disabled = false;
    inputFileSize = Math.round(img.files[0].size / 1022)
    displayImgSize.textContent = ` - ${inputFileSize} kb`
    const pathImgUrl = img.files[0].path.replaceAll('\\', '/')
    document.body.style.setProperty('--imgUrl', `url(${pathImgUrl})`)
})

// RESIZE btn - change size of image
form.addEventListener('submit', e => {
    e.preventDefault();
    quality = Number(slider.value)
    // Send data to main.js
    ipcRenderer.send('img:sizeReduce', {
        imgPath: slash(img.files[0].path),
        quality,
        outputPath: slash(outputPath)
    })
})

// Received from main.js - triggered after resize
ipcRenderer.on('reply-size', (e, err) => {
    // show output size (in kb)
    const outputFileSize = Math.round(statSync(outputPath + img.files[0].name).size / 1024)
    submitBtn.value = `RESIZE - ${outputFileSize} kb`

    // update preview
    const pathImgUrl = slash(outputPath + img.files[0].name)
    let randNum = Math.random() * 999
    document.body.style.setProperty('--imgUrl', `url(${pathImgUrl + '?' + randNum})`)

    // send notification
    if (!err) {
        new Notification(`Completed!, quality - ${quality}%`, {
            body: ` Size changed from ${inputFileSize}kb to ${outputFileSize}kb`,
            icon: '../assets/icons/Icon_32x32.png',
        })
    }

    // toads animation
    toads.style.animation = 'none'
    toads.offsetTop;
    toads.textContent = (!err)
        ? `Image resized to ${quality}% quality`
        : 'Delete previous file, to resize again'
    toads.style.animation = 'toads 4s'
})

