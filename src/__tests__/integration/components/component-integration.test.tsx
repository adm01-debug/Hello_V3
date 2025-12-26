import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Component Integration Tests', () => {
  describe('CallForm Integration', () => {
    it('should complete full call workflow', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(<CallForm onSubmit={onSubmit} />);

      // Select contact
      const contactSelect = screen.getByLabelText(/select contact/i);
      await user.selectOptions(contactSelect, 'contact123');

      // Enter notes
      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'Important call');

      // Start call
      const startButton = screen.getByRole('button', { name: /start call/i });
      await user.click(startButton);

      // Verify call started
      await waitFor(() => {
        expect(screen.getByText(/call in progress/i)).toBeInTheDocument();
      });

      // End call
      const endButton = screen.getByRole('button', { name: /end call/i });
      await user.click(endButton);

      // Verify form submitted
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            contactId: 'contact123',
            notes: 'Important call',
            duration: expect.any(Number),
          })
        );
      });
    });
  });

  describe('ContactList and ContactForm Integration', () => {
    it('should add and display new contact', async () => {
      const user = userEvent.setup();

      render(
        <>
          <ContactForm />
          <ContactList />
        </>
      );

      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');

      // Submit
      const submitButton = screen.getByRole('button', { name: /add contact/i });
      await user.click(submitButton);

      // Verify contact appears in list
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('+1234567890')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Widgets Integration', () => {
    it('should update all widgets on data change', async () => {
      const { rerender } = render(
        <Dashboard
          stats={{
            totalCalls: 10,
            avgDuration: 120,
            successRate: 95,
          }}
        />
      );

      // Verify initial state
      expect(screen.getByText(/10 calls/i)).toBeInTheDocument();
      expect(screen.getByText(/2 min avg/i)).toBeInTheDocument();
      expect(screen.getByText(/95% success/i)).toBeInTheDocument();

      // Update data
      rerender(
        <Dashboard
          stats={{
            totalCalls: 15,
            avgDuration: 150,
            successRate: 98,
          }}
        />
      );

      // Verify all widgets updated
      await waitFor(() => {
        expect(screen.getByText(/15 calls/i)).toBeInTheDocument();
        expect(screen.getByText(/2.5 min avg/i)).toBeInTheDocument();
        expect(screen.getByText(/98% success/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter Integration', () => {
    it('should filter contacts by search query', async () => {
      const user = userEvent.setup();
      const contacts = [
        { id: '1', name: 'Alice', phone: '111' },
        { id: '2', name: 'Bob', phone: '222' },
        { id: '3', name: 'Charlie', phone: '333' },
      ];

      render(<ContactSearchList contacts={contacts} />);

      // Verify all contacts visible
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();

      // Search for "bob"
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'bob');

      // Verify filtered results
      await waitFor(() => {
        expect(screen.queryByText('Alice')).not.toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
      });
    });
  });
});

// Stub components
const CallForm = ({ onSubmit }: any) => <form onSubmit={onSubmit}>...</form>;
const ContactForm = () => <form>...</form>;
const ContactList = () => <div>...</div>;
const Dashboard = ({ stats }: any) => <div>{stats.totalCalls} calls</div>;
const ContactSearchList = ({ contacts }: any) => (
  <div>
    <input placeholder="Search contacts" />
    {contacts.map((c: any) => <div key={c.id}>{c.name}</div>)}
  </div>
);
