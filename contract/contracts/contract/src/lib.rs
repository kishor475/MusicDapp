#![no_std]

use soroban_sdk::{contract, contracttype, contractimpl, Env, String, Symbol, symbol_short};

// Storage key for counting songs
const SONG_COUNT: Symbol = symbol_short!("S_COUNT");

// Storage mapping
#[contracttype]
pub enum SongBook {
    Song(u64)
}

// Song structure
#[contracttype]
#[derive(Clone)]
pub struct Song {
    pub id: u64,
    pub title: String,
    pub artist: String,
    pub price: u64,
    pub owner: String,
}

// Contract
#[contract]
pub struct MusicDAppContract;

#[contractimpl]
impl MusicDAppContract {

    // 1. Upload a new song
    pub fn upload_song(env: Env, title: String, artist: String, price: u64, owner: String) -> u64 {
        let mut count: u64 = env.storage().instance().get(&SONG_COUNT).unwrap_or(0);
        count += 1;

        let song = Song {
            id: count,
            title,
            artist,
            price,
            owner,
        };

        env.storage().instance().set(&SongBook::Song(count), &song);
        env.storage().instance().set(&SONG_COUNT, &count);

        count
    }

    // 2. Get song details
    pub fn get_song(env: Env, id: u64) -> Song {
        env.storage().instance().get(&SongBook::Song(id)).unwrap_or(Song {
            id: 0,
            title: String::from_str(&env, "Not Found"),
            artist: String::from_str(&env, "Not Found"),
            price: 0,
            owner: String::from_str(&env, "None"),
        })
    }

    // 3. Purchase song (ownership transfer simulation)
    pub fn purchase_song(env: Env, id: u64, new_owner: String) {
        let mut song = Self::get_song(env.clone(), id);

        if song.id == 0 {
            panic!("Song does not exist");
        }

        song.owner = new_owner;

        env.storage().instance().set(&SongBook::Song(id), &song);
    }

    // 4. Get total songs uploaded
    pub fn total_songs(env: Env) -> u64 {
        env.storage().instance().get(&SONG_COUNT).unwrap_or(0)
    }
}