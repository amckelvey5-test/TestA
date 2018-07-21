const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Models
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// Validaton
const validatePostInput = require("../../validation/post");

// @route   GET api/posts/test
// @dsc     Tests posts route
// @access  Public
router.get("/test", (req, res) => res.json({ msg: "posts works" }));

// @route   GET api/posts
// @dsc     Get posts
// @access  Public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err =>
      res
        .status(400)
        .json({ noposts: "No posts were found", internalError: err })
    );
});

// @route   GET api/posts/:id
// @dsc     Get post by id
// @access  Public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res
        .status(400)
        .json({ nopost: "Post was not found with that ID", internalError: err })
    );
});

// @route   POST api/posts
// @dsc     Create post
// @access  Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newPost = Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost.save().then(post => res.json(post));
  }
);

// @route   DELETE api/posts/:id
// @dsc     Get post by id
// @access  Private
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          // Check for post owner
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notauthorized: "User not authorized" });
          }
          // Delete
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err =>
          res.status(404).json({
            nopost: "Post was not found with that ID",
            internalError: err
          })
        );
    });
  }
);

// @route   POST api/posts/like/:id
// @dsc     Like a post
// @access  Private
router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyLiked: "User already liked this post" });
          }

          // Add user ID to likes array
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => res.json(post));
        })
        .catch(err =>
          res.status(404).json({
            nopost: "Post was not found with that ID",
            internalError: err
          })
        );
    });
  }
);

// @route   POST api/posts/unlike/:id
// @dsc     Unlike a post
// @access  Private
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notLiked: "User has not yet liked this post" });
          }

          // Get remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);
          if (removeIndex < 0) {
            return res
              .status(400)
              .json({ notLiked: "Like index was not found" });
          }

          // Splice out of array
          post.likes.splice(removeIndex, 1);
          post.save().then(post => res.json(post));
        })
        .catch(err =>
          res.status(404).json({
            nopost: "Post was not found with that ID",
            internalError: err
          })
        );
    });
  }
);

// @route   POST api/posts/comment/:id
// @dsc     Add a comment to a post
// @access  Private
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        // Add comment to array
        post.comments.unshift(newComment);
        post.save().then(post => res.json(post));
      })
      .catch(err =>
        res
          .status(404)
          .json({ nopost: "Post was not found", internalError: err })
      );
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @dsc     Delete a comment from a post
// @access  Private
router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        // Check to see if comment exists
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res.status(404).json({ nocomment: "Comment does not exist" });
        }

        // Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);
        if (removeIndex < 0) {
          return res
            .status(404)
            .json({ nocomment: "Comment still does not exist" });
        }

        // Splice out of array
        post.comments.splice(removeIndex, 1);
        post.save().then(post => res.json(post));
      })
      .catch(err =>
        res
          .status(404)
          .json({ nopost: "Post was not found", internalError: err })
      );
  }
);

module.exports = router;
