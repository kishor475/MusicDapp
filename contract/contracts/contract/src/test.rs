#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String};

#[test]
fn test_upload_and_get_song() {
    let env = Env::default();
    let contract_id = env.register_contract(None, MusicDAppContract);
    let client = MusicDAppContractClient::new(&env, &contract_id);

    // Upload song
    let song_id = client.upload_song(
        &String::from_str(&env, "Song1"),
        &String::from_str(&env, "Artist1"),
        &10,
        &String::from_str(&env, "Owner1"),
    );

    // Fetch song
    let song = client.get_song(&song_id);

    assert_eq!(song.id, 1);
    assert_eq!(song.title, String::from_str(&env, "Song1"));
    assert_eq!(song.artist, String::from_str(&env, "Artist1"));
    assert_eq!(song.price, 10);
    assert_eq!(song.owner, String::from_str(&env, "Owner1"));
}

#[test]
fn test_purchase_song() {
    let env = Env::default();
    let contract_id = env.register_contract(None, MusicDAppContract);
    let client = MusicDAppContractClient::new(&env, &contract_id);

    // Upload song
    let song_id = client.upload_song(
        &String::from_str(&env, "Song2"),
        &String::from_str(&env, "Artist2"),
        &20,
        &String::from_str(&env, "Owner1"),
    );

    // Purchase song
    client.purchase_song(&song_id, &String::from_str(&env, "Owner2"));

    // Verify ownership changed
    let song = client.get_song(&song_id);

    assert_eq!(song.owner, String::from_str(&env, "Owner2"));
}

#[test]
fn test_total_songs() {
    let env = Env::default();
    let contract_id = env.register_contract(None, MusicDAppContract);
    let client = MusicDAppContractClient::new(&env, &contract_id);

    // Initially 0
    let total_before = client.total_songs();
    assert_eq!(total_before, 0);

    // Upload songs
    client.upload_song(
        &String::from_str(&env, "Song1"),
        &String::from_str(&env, "Artist1"),
        &10,
        &String::from_str(&env, "Owner1"),
    );

    client.upload_song(
        &String::from_str(&env, "Song2"),
        &String::from_str(&env, "Artist2"),
        &20,
        &String::from_str(&env, "Owner2"),
    );

    // Check total
    let total_after = client.total_songs();
    assert_eq!(total_after, 2);
}

#[test]
#[should_panic(expected = "Song does not exist")]
fn test_invalid_purchase() {
    let env = Env::default();
    let contract_id = env.register_contract(None, MusicDAppContract);
    let client = MusicDAppContractClient::new(&env, &contract_id);

    // Try to purchase non-existent song
    client.purchase_song(&1, &String::from_str(&env, "OwnerX"));
}