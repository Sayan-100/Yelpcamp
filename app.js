const express = require('express');
const app = express();
const path = require('path');
const catchAsync = require('./utilis/catchAsync');
const ExpressError = require('./utilis/ExpressError');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
// const Joi = require('joi');
const Review = require('./models/review');
const methodOverride = require('method-override');
const Campground = require('./models/campground');
const {campgroundSchema, reviewSchema} =require('./schemas');

//Database
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser : true,
    // useCreateIndex: true,
    useUnifiedTopology : true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error:"));
db.once('open', () => {
    console.log("database connected");
});



app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended : true }));
app.use(methodOverride('_method'));

const validateCampground = (req, res, next) => {
   
    const {error} = campgroundSchema.validate(req.body);
    if(error)
    {
        const message = error.details.map(el => el.message).join(',')
        throw new ExpressError(message, 400);
    }

    else
    {
        next();
    }
}

const validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if(error)
    {
        const message = error.details.map(el => el.message).join(',')
        throw new ExpressError(message, 400);
    }

    else
    {
        next();
    }
}

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/campgrounds', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', {campgrounds});
}))


// app.get('/makecampground', async (req, res) => {
//     const camp = new Campground({title : 'My Backyard', description : 'cheap camping'});
//     await camp.save();
//     res.send(camp);
// })


app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new');
})

app.post('/campgrounds', validateCampground, catchAsync(async(req, res, next) => {

    // try {
    // if(!req.body.campground) throw new ExpressError('Invalid campground Data', 401);
    // if(!req.body.campground.price) {

    // }
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
    // } catch(err) {
    //     next(err);
    // }
}))

app.get('/campgrounds/:id', catchAsync(async(req, res) => {
    // console.log('This ', req.params);
    // console.log('This', req.body);
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/show', {campground});
}))

app.get('/campgrounds/:id/edit', catchAsync(async(req, res) => {
    const campground = await Campground.findById(req.params.id)
    // console.log(campground.location);
    res.render('campgrounds/edit', {campground});
}))

app.put('/campgrounds/:id', validateCampground, catchAsync(async(req, res) => {
    // res.send("It worked");
    const {id} = req.params;
    // Campground.findByIdAndUpdate(id, {title : '', location : ''})
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground});
    res.redirect(`/campgrounds/${campground._id}`);

}))

app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}))

app.post('/campgrounds/:id/reviews', validateReview, catchAsync( async(req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);

}))

app.all('*', (req, res, next) => {
    next(new ExpressError('Not Found', 404));
})

app.use((err, req, res, next) => {
    // const {statusCode = 500, message = 'Something went wrong'} = err;
    // res.status(statusCode).send(message);

    const {statusCode = 500} = err;

    if(!err.message)
    {
        err.message = "Oh No, Something went wrong!"
    }

    res.status(statusCode).render('error', {err});
    // res.send('Something went wrong');
})

app.listen(5000, () => {
    console.log("serving on port 5000");
})