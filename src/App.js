import React, { Component } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote
} from "./graphql/subscriptions";
import { withAuthenticator } from "aws-amplify-react";

class App extends Component {
  state = {
    id: "",
    note: "",
    notes: []
  };

  componentDidMount() {
    this.getNotes();
    this.createNoteListener = API.graphql(
      graphqlOperation(onCreateNote)
    ).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote;
        const prevNotes = this.state.notes.filter(
          note => note.id !== newNote.id
        );
        const updatedNotes = [...prevNotes, newNote];
        this.setState({ notes: updatedNotes });
      }
    });

    this.deleteNoteListener = API.graphql(
      graphqlOperation(onDeleteNote)
    ).subscribe({
      next: noteData => {
        const deletedNote = noteData.value.data.onDeleteNote;
        const updatedNotes = this.state.notes.filter(
          note => note.id !== deletedNote.id
        );
        this.setState({ notes: updatedNotes });
      }
    });
    this.updateNoteListener = API.graphql(
      graphqlOperation(onUpdateNote)
    ).subscribe({
      next: noteData => {
        const updatedNote = noteData.value.data.onUpdateNote;
        const index = this.state.notes.findIndex(
          note => note.id === updatedNote.id
        );
        const updatedNotes = [
          ...this.state.notes.slice(0, index),
          updatedNote,
          ...this.state.notes.slice(index + 1)
        ];
        this.setState({ notes: updatedNotes });
      }
    });
  }

  componentWillUnmount() {
    this.createNoteListener.unsubscribe();
    this.deleteNoteListener.unsubscribe();
    this.updateNoteListener.unsubscribe();
  }

  getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    this.setState({ notes: result.data.listNotes.items });
  };

  handleChangeNote = event => this.setState({ note: event.target.value });

  hasExistingNote = () => {
    const { notes, id } = this.state;
    if (id) {
      // is the id a valid id?
      const isNote = notes.findIndex(note => note.id === id) > -1;

      return isNote;
    }

    return false;
  };

  handleAddNote = async event => {
    event.preventDefault();
    const { note } = this.state;

    // check if we have an existing note, if so update it
    if (this.hasExistingNote()) {
      this.handleUpdateNote();
    } else {
      const input = { note };
      await API.graphql(graphqlOperation(createNote, { input }));
      this.setState({ note: "" });
    }
  };

  handleUpdateNote = async () => {
    const { id, note } = this.state;
    const input = { id, note };
    await API.graphql(graphqlOperation(updateNote, { input }));
    // const updatedNote = result.data.updateNote;
    // const index = notes.findIndex(note => note.id === updatedNote.id);
    // const updatedNotes = [
    //   ...notes.slice(0, index),
    //   updatedNote,
    //   ...notes.slice(index + 1)
    // ];

    // this.setState({ notes: updatedNotes, note: "", id: "" });
  };

  handleDeleteNote = async noteId => {
    // const { notes } = this.state;
    const input = { id: noteId };
    await API.graphql(graphqlOperation(deleteNote, { input }));

    // const deletedNoteId = result.data.deleteNote.id;
    // const updatedNotes = notes.filter(note => note.id !== deletedNoteId);
    // this.setState({ notes: updatedNotes });
  };

  handleSetNote = ({ note, id }) => {
    this.setState({ note, id });
  };

  render() {
    const { notes, note, id } = this.state;

    return (
      <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
        <h1 className="code f2-l"> Amplify Notetaker </h1>
        {/* Note Form */}
        <form className="mb3" onSubmit={this.handleAddNote}>
          <input
            type="text"
            className="pa2 f4"
            placeholder="Write your note"
            onChange={this.handleChangeNote}
            value={note}
          />
          <button className="pa2 f4" type="submit">
            {id ? "Update Note" : "Add Note"}
          </button>
        </form>

        {/* Note List */}
        <div>
          {notes.map(item => (
            <div key={item.id} className="flex items-center">
              <li
                onClick={() => this.handleSetNote(item)}
                className="list pa1 f3"
              >
                {item.note}
              </li>
              <button
                onClick={() => this.handleDeleteNote(item.id)}
                className="bg-transparent bn f4"
              >
                <span>&times;</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default withAuthenticator(App, {
  includeGreetings: true
});
