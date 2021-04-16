/** Tests for the books routes */

process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testBookISBN;

beforeEach(async () => {
  let result = await db.query(`
        INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
            VALUES(
                '1234567890',
                'https://a.co/test',
                'Carl Diggler',
                'english',
                413,
                'Scholastic Books',
                'On the Origin of Fake Test Data',
                2015)
            RETURNING isbn`);
  testBookISBN = result.rows[0].isbn;
});

describe("POST /books", async () => {
  test("It should make a new book", async () => {
    const response = await request(app).post("/books").send({
      isbn: "9876543210",
      amazon_url: "https://a.co/fake",
      author: "Mike Nesmith",
      language: "english",
      pages: 612,
      publisher: "Random House Books",
      title: "The Real Fake Book",
      year: 1999,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("It shouldn't make a new book with improperly typed data", async () => {
    const response = await request(app).post("/books").send({
      isbn: "9876543210",
      amazon_url: "https://a.co/fake",
      author: "Mike Nesmith",
      language: "english",
      pages: "612", // string instead of integer
      publisher: "Random House Books",
      title: "The Real Fake Book",
      year: 1999,
    });
    expect(response.statusCode).toBe(400);
  });

  test("It shouldn't make a new book with bad fields", async () => {
    const response = await request(app).post("/books").send({
      isbn: "9876543210",
      amazon_url: "https://a.co/fake",
      author: "Mike Nesmith",
      language: "english",
      extra_property: "HEY WHAT'S THIS DOING HERE", // bad field
      pages: 612,
      publisher: "Random House Books",
      title: "The Real Fake Book",
      year: 1999,
    });
    expect(response.statusCode).toBe(400);
  });

  test("It shouldn't make a book with insufficient data", async () => {
    const response = await request(app).post("/books").send({
      author: "Rick Astley",
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("GET /books/:isbn", async () => {
  test("It should get a single book", async () => {
    const response = await request(app).get(`/books/${testBookISBN}`);
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(testBookISBN);
  });

  test("It should send 404 for a book w/ nonexistent ISBN", async () => {
    const response = await request(app).get("/books/5555555555");
    expect(response.statusCode).toBe(404);
  });
});

describe("PUT /books/:isbn", async () => {
  test("It should update a single book", async () => {
    const response = await request(app).put(`/books/${testBookISBN}`).send({
      amazon_url: "https://a.co/newurl",
      author: "Carl Sagan",
      language: "esperanto",
      pages: 525600,
      publisher: "Columbia Pictures",
      title: "New Title",
      year: 1873,
    });
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.author).toBe("Carl Sagan");
    expect(response.body.book.title).toBe("New Title");
  });

  test("It shouldn't update with insufficient data", async () => {
    const response = await request(app).put(`/books/${testBookISBN}`).send({
      pages: 500,
    });
    expect(response.statusCode).toBe(400);
  });

  test("It shouldn't update with a bad field", async () => {
    const response = await request(app).put(`/books/${testBookISBN}`).send({
      amazon_url: "https://a.co/newurl",
      author: "Carl Sagan",
      language: "esperanto",
      extra_field: "THIS DOESN'T BELONG HERE", // bad field
      pages: 525600,
      publisher: "Columbia Pictures",
      title: "New Title",
      year: 1873,
    });
    expect(response.statusCode).toBe(400);
  });

  test("It shouldn't update with improperly typed data", async () => {
    const response = await request(app).put(`/books/${testBookISBN}`).send({
      amazon_url: "https://a.co/newurl",
      author: "Carl Sagan",
      language: "esperanto",
      pages: 525600,
      publisher: "Columbia Pictures",
      title: "New Title",
      year: "1873", // string instead of integer
    });
    expect(response.statusCode).toBe(400);
  });

  test("It should respond with 404 for a book whose ISBN doesn't exist", async () => {
    const response = await request(app).put("/books/5555555555").send({
      amazon_url: "https://a.co/newurl",
      author: "Carl Sagan",
      language: "esperanto",
      pages: 525600,
      publisher: "Columbia Pictures",
      title: "New Title",
      year: 1873,
    });
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /books/:isbn", async () => {
  test("It should delete a single book", async () => {
    const response = await request(app).delete(`/books/${testBookISBN}`);
    expect(response.body).toEqual({ message: "Book deleted" });
  });

  test("It should respond with 404 for a book whose ISBN doesn't exist", async () => {
    const response = await request(app).delete(`/books/5555555555`);
    expect(response.statusCode).toEqual(404);
  });
});

afterEach(async () => {
  await db.query("DELETE FROM books");
});

afterAll(async () => {
  await db.end();
});
