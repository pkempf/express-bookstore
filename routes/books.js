const express = require("express");
const Book = require("../models/book");
const ExpressError = require("../expressError");

const { validate } = require("jsonschema");
const newBookSchema = require("../schemas/newBookSchema.json");
const updateBookSchema = require("../schemas/updateBookSchema.json");

const router = new express.Router();

/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:id", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.id);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async function (req, res, next) {
  try {
    const validCheck = validate(req.body, newBookSchema);
    if (!validCheck.valid) {
      let errorMessage = validCheck.errors.map((e) => e.stack);
      return next(new ExpressError(errorMessage, 400));
    }

    const book = await Book.create(req.body);
    return res.status(201).json({ book });
  } catch (err) {
    return next(err);
  }
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", async function (req, res, next) {
  try {
    if ("isbn" in req.body) {
      const isbnError = new ExpressError(
        "Bad request: ISBN in request body",
        400
      );
      return next(isbnError);
    }

    const validCheck = validate(req.body, updateBookSchema);
    if (!validCheck.valid) {
      let errorMessage = validCheck.errors.map((e) => e.stack);
      return next(new ExpressError(errorMessage, 400));
    }
    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
