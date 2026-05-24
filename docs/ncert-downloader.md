# NCERT Auto Downloader

The NCERT Auto Downloader is a manual, server-side helper for official NCERT/ePathshala textbook PDFs.

## Configure Local Storage

Set the local textbook root in `.env.local`:

```env
LOCAL_TEXTBOOK_ROOT=I:\Eductions
NCERT_AUTO_CHECK_ENABLED=false
```

Downloaded files are saved under:

```text
LOCAL_TEXTBOOK_ROOT\9thText_Books\<targetFolder>\<BookTitle>\
```

For example, Kaveri downloads to:

```text
I:\Eductions\9thText_Books\English\Kaveri\
```

## Add A Required NCERT Book

Edit `lib/ncert-required-books.ts` and add a new object to `requiredNcertBooks`.

Required fields:

- `id`: stable app ID, for example `class9-english-kaveri`
- `childId`: `jayadeep` or `harini`
- `grade`: display grade, for example `Class 9`
- `classNumber`: NCERT class number
- `subject`: app subject label
- `bookTitle`: NCERT book title
- `targetFolder`: local textbook folder under `9thText_Books`
- `enabled`: `true` or `false`
- `source`: `NCERT`
- `materialType`: usually `Textbook`
- `ncertBookCode`: NCERT URL code, for example `iebe1`
- `chapterStart` and `chapterEnd`

## How To Use

1. Open `/ncert`.
2. Click `Check Availability`.
3. Review detected official NCERT files.
4. Click `Download` to save PDFs locally.
5. Click `Download + Import + Index` to register and index them for AI Teacher.

## Limitations

- This is intentionally manual. There is no scheduled checking unless you build it later.
- It only downloads from allowlisted official domains:
  - `ncert.nic.in`
  - `epathshala.nic.in`
- NCERT may change page structure. If detection fails, download manually from `https://ncert.nic.in/textbook.php` and place files in the textbook folder.
- The app skips existing files unless `forceDownload` is enabled through the API.
