-- Seed data: 10 public-domain tracks hosted locally
INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
SELECT 'Ave Maria', 'Enrico Caruso', 'Public Domain Recordings', 'Classical', 210, '/media/audio/Caruso-AveMaria.ogg', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tracks WHERE title = 'Ave Maria' AND artist = 'Enrico Caruso'
);

INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
SELECT 'No! Pagliaccio non son!', 'Enrico Caruso', 'Public Domain Recordings', 'Classical', 190, '/media/audio/No_Pagliaccio_non_son.ogg', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tracks WHERE title = 'No! Pagliaccio non son!' AND artist = 'Enrico Caruso'
);

INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
SELECT 'Vesti la giubba', 'Enrico Caruso', 'Public Domain Recordings', 'Classical', 200, '/media/audio/Vesti_La_Giubba.ogg', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tracks WHERE title = 'Vesti la giubba' AND artist = 'Enrico Caruso'
);

INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
SELECT 'La partida', 'Enrico Caruso', 'Public Domain Recordings', 'Classical', 205, '/media/audio/La_Partida.ogg', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tracks WHERE title = 'La partida' AND artist = 'Enrico Caruso'
);

INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
SELECT 'O soave fanciulla', 'Enrico Caruso & Nellie Melba', 'Public Domain Recordings', 'Classical', 240, '/media/audio/Enrico_Caruso_-_Nellie_Melba_-_La_Boheme_-_O_soave_fanciulla.ogg', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tracks WHERE title = 'O soave fanciulla' AND artist = 'Enrico Caruso & Nellie Melba'
);

INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
SELECT 'Recondita armonia', 'Enrico Caruso', 'Public Domain Recordings', 'Classical', 200, '/media/audio/Enrico_Caruso_Recondita_armonia.ogg', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tracks WHERE title = 'Recondita armonia' AND artist = 'Enrico Caruso'
);

INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
SELECT 'Donna non vidi mai', 'Enrico Caruso', 'Public Domain Recordings', 'Classical', 190, '/media/audio/Enrico_Caruso_Donna_non_vidi_mai.ogg', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tracks WHERE title = 'Donna non vidi mai' AND artist = 'Enrico Caruso'
);

INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
SELECT 'È scherzo od è follia', 'Enrico Caruso et al.', 'Public Domain Recordings', 'Classical', 230, '/media/audio/Caruso_et_al_E_scherzo_od_e_follia.ogg', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tracks WHERE title = 'È scherzo od è follia' AND artist = 'Enrico Caruso et al.'
);

INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
SELECT 'Air (Bach)', 'J.S. Bach', 'Public Domain Recordings', 'Classical', 200, '/media/audio/Air_Bach.ogg', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tracks WHERE title = 'Air (Bach)' AND artist = 'J.S. Bach'
);

INSERT INTO tracks (title, artist, album, genre, duration_sec, audio_url, cover_url)
SELECT 'A Dream', 'Victor Orchestra', 'Public Domain Recordings', 'Classical', 220, '/media/audio/Victrola-87321-b24466.ogg', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM tracks WHERE title = 'A Dream' AND artist = 'Victor Orchestra'
);
