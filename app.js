// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/simple-doc-website', { useNewUrlParser: true, useUnifiedTopology: true });

// Define mongoose models for Category and Post
const Category = mongoose.model('Category', { name: String, posts: [{ title: String, content: String }] });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', async (req, res) => {
    const categories = await Category.find();
    res.render('index', { categories, selectedPost: null });
});

app.post('/category', async (req, res) => {
    const { categoryName } = req.body;
    const newCategory = new Category({ name: categoryName, posts: [] });
    await newCategory.save();
    res.redirect('/');
});

app.post('/post/:categoryId', async (req, res) => {
    const { title, content } = req.body;
    const categoryId = req.params.categoryId;
    await Category.findByIdAndUpdate(categoryId, { $push: { posts: { title, content } } });
    res.redirect('/');
});

app.get('/post/:categoryId/:postId', async (req, res) => {
    const categoryId = req.params.categoryId;
    const postId = req.params.postId;

    const category = await Category.findById(categoryId);
    const selectedPost = category.posts.find(post => post._id == postId);

    const categories = await Category.find();
    res.render('index', { categories, selectedPost });
});

app.get('/deletePost/:categoryId/:postId', async (req, res) => {
    const { categoryId, postId } = req.params;
    await Category.findByIdAndUpdate(categoryId, { $pull: { posts: { _id: postId } } });
    res.redirect('/');
});

app.get('/deleteCategory/:categoryId', async (req, res) => {
    const { categoryId } = req.params;

    try {
        const deletedCategory = await Category.findOneAndDelete({ _id: categoryId });

        if (!deletedCategory) {
            // Category not found
            return res.status(404).send('Category not found.');
        }

        // Category deleted successfully
        res.redirect('/');
    } catch (error) {
        // Error while deleting category
        console.error(error);
        res.status(500).send('Internal Server Error.');
    }
});
// Update the existing route
app.post('/editPost/:categoryId/:postId', async (req, res) => {
    const { categoryId, postId } = req.params;
    const { editedContent } = req.body;

    // Check if categoryId is defined
    if (!categoryId) {
        return res.status(400).json({ success: false, error: 'categoryId is undefined.' });
    }

    try {
        // Update the post content in the database
        await Category.findOneAndUpdate(
            { '_id': categoryId, 'posts._id': postId },
            { $set: { 'posts.$.content': editedContent } },
            { new: true } // Added option to return the updated document
        );

        res.status(200).json({ success: true, message: 'Post content updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error.' });
    }
});

app.post('/editCategory/:categoryId', async (req, res) => {
    const { categoryId } = req.params;
    const { editedCategoryName } = req.body;

    try {
        const updatedCategory = await Category.findByIdAndUpdate(categoryId, { name: editedCategoryName }, { new: true });

        if (!updatedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error.');
    }
});

// Listen
/*const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); */
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://your_remote_server_ip:${PORT}`);
});
