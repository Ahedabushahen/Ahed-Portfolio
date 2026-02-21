import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { sendThankYouEmail, sendAdminNotification } from '../../services/emailService';
import './contact.css';

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type Status = 'idle' | 'sending' | 'success' | 'error';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Contact() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Partial<FormState>>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validate(): boolean {
    const newErrors: Partial<FormState> = {};
    if (form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters.';
    if (!validateEmail(form.email)) newErrors.email = 'Please enter a valid email.';
    if (form.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus('sending');

    try {
      await addDoc(collection(db, 'messages'), {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
        status: 'new',
        createdAt: serverTimestamp(),
      });

      await Promise.allSettled([
        sendThankYouEmail(form.name.trim(), form.email.trim()),
        sendAdminNotification({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      ]);

      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <section id="contact" className="contact section">
        <div className="section__inner">
          <div className="contact__success">
            <div className="contact__success-icon">✓</div>
            <h3>Message Sent!</h3>
            <p>Thanks for reaching out. I'll get back to you soon.</p>
            <button className="btn btn--outline" onClick={() => setStatus('idle')}>
              Send Another
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="contact section">
      <div className="section__inner">
        <p className="section__label">Get In Touch</p>
        <h2 className="section__title">Contact Me</h2>
        <p className="contact__subtitle">
          Have a project in mind or just want to say hi? Drop me a message.
        </p>

        <div className="contact__wrapper">
          <form className="contact__form" onSubmit={handleSubmit} noValidate>
            <div className="contact__row">
              <div className="form-group">
                <label htmlFor="c-name">Name *</label>
                <input
                  id="c-name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  className={errors.name ? 'input--error' : ''}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="c-email">Email *</label>
                <input
                  id="c-email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className={errors.email ? 'input--error' : ''}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="c-subject">Subject</label>
              <input
                id="c-subject"
                name="subject"
                type="text"
                placeholder="Project inquiry..."
                value={form.subject}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="c-message">Message *</label>
              <textarea
                id="c-message"
                name="message"
                rows={6}
                placeholder="Tell me about your project..."
                value={form.message}
                onChange={handleChange}
                className={errors.message ? 'input--error' : ''}
              />
              {errors.message && <span className="field-error">{errors.message}</span>}
            </div>

            {status === 'error' && (
              <p className="contact__error">
                Something went wrong. Please try again.
              </p>
            )}

            <button
              type="submit"
              className="btn btn--primary contact__submit"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
          </form>

          <div className="contact__info">
            <div className="contact__info-item">
              <span className="contact__info-icon">✉</span>
              <div>
                <p className="contact__info-label">Email</p>
                <a href="mailto:ahed10ah@gmail.com" className="contact__info-value contact__info-link">
                  ahed10ah@gmail.com
                </a>
              </div>
            </div>
            <div className="contact__info-item">
              <span className="contact__info-icon">📍</span>
              <div>
                <p className="contact__info-label">Location</p>
                <p className="contact__info-value">Israel</p>
              </div>
            </div>
            <div className="contact__info-item">
              <span className="contact__info-icon">⏱</span>
              <div>
                <p className="contact__info-label">Response Time</p>
                <p className="contact__info-value">Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
